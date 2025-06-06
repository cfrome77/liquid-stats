import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
// Ensure ProcessedStats in stats.model.ts is updated as per previous instructions
import { BeerCheckin, ProcessedStats, TopBeer, DayOfWeekCheckinCount, MonthlyCheckinCount, RatingOverTime } from './stats.model';
import * as moment from 'moment'; // Import moment for easier date handling

@Injectable({ providedIn: 'root' })
export class StatsService {
    constructor(private http: HttpClient) { }

    loadBeerData(): Observable<BeerCheckin[]> {
        const url = `https://liquid-stats.s3.amazonaws.com/beers.json?cb=${Date.now()}`; // prevent caching
        return this.http.get<{ beers: BeerCheckin[] }>(url).pipe(map(data => data.beers));
    }

    computeStats(beers: BeerCheckin[], start: Date, end: Date): ProcessedStats {
        const beersInRange = beers.filter(b => {
            const date = new Date(b.recent_created_at);
            return date >= start && date <= end;
        });

        const uniqueBeersSet = new Set(beersInRange.map(b => b.beer.bid));
        const totalUniqueBeers = uniqueBeersSet.size;

        const totalCheckins = beersInRange.reduce((sum, b) => sum + (b.count ?? 1), 0);

        // This counts new beers that fall within the date range, and are also unique within that range.
        const newBeersCount = beers.filter(b => {
            const firstDate = new Date(b.first_created_at);
            return firstDate >= start && firstDate <= end && uniqueBeersSet.has(b.beer.bid);
        }).length;

        const newBeerRatio = totalUniqueBeers > 0 ? newBeersCount / totalUniqueBeers : 0;

        const totalRatingSum = beersInRange.reduce(
            (sum, b) => sum + b.rating_score * (b.count ?? 1),
            0
        );
        const averageRating = totalCheckins > 0 ? totalRatingSum / totalCheckins : 0;

        const uniqueBreweriesSet = new Set(beersInRange.map(b => b.brewery.brewery_name));
        const totalUniqueBreweries = uniqueBreweriesSet.size;

        const beerStylesCount: Record<string, number> = {};
        const hourly: number[] = new Array(24).fill(0);
        const beerTally: Record<string, { count: number; ratingSum: number }> = {};

        const countryCounts: Record<string, number> = {};
        const stateCounts: Record<string, number> = {};

        const dailyCountsMap: Record<string, number> = {};

        // --- NEW: Data structures for the missing charts ---
        const dayOfWeekCountsMap: Record<string, number> = {
            'Sunday': 0, 'Monday': 0, 'Tuesday': 0, 'Wednesday': 0,
            'Thursday': 0, 'Friday': 0, 'Saturday': 0
        };
        const monthCountsMap: Record<string, number> = {
            'Jan': 0, 'Feb': 0, 'Mar': 0, 'Apr': 0, 'May': 0, 'Jun': 0,
            'Jul': 0, 'Aug': 0, 'Sep': 0, 'Oct': 0, 'Nov': 0, 'Dec': 0
        };
        const dailyRatingsMap: Record<string, { sum: number; count: number }> = {};
        // --- End NEW data structures ---

        beersInRange.forEach(b => {
            const count = b.count ?? 1;
            const style = b.beer.beer_style || 'Unknown';
            const checkinMoment = moment(b.recent_created_at);
            const hour = checkinMoment.hours();
            const name = b.beer.beer_name;

            // Count styles
            beerStylesCount[style] = (beerStylesCount[style] || 0) + count;

            // Hourly checkins
            hourly[hour] += count;

            // Beer tally for top beers
            if (!beerTally[name]) beerTally[name] = { count: 0, ratingSum: 0 };
            beerTally[name].count += count;
            beerTally[name].ratingSum += b.rating_score * count;

            // Count by country
            const country = b.brewery.country_name || 'Unknown';
            countryCounts[country] = (countryCounts[country] || 0) + count;

            // Count by state
            const state = b.brewery.location.brewery_state || 'Unknown';
            stateCounts[state] = (stateCounts[state] || 0) + count;

            // Count by day (YYYY-MM-DD)
            const dayIso = checkinMoment.format('YYYY-MM-DD');
            dailyCountsMap[dayIso] = (dailyCountsMap[dayIso] || 0) + count;

            // --- NEW: Populate data for day of week, month, and ratings over time ---
            const dayOfWeek = checkinMoment.format('dddd'); // e.g., "Monday"
            dayOfWeekCountsMap[dayOfWeek] = (dayOfWeekCountsMap[dayOfWeek] || 0) + count;

            const month = checkinMoment.format('MMM'); // e.g., "Jan"
            monthCountsMap[month] = (monthCountsMap[month] || 0) + count;

            // For average ratings over time
            if (!dailyRatingsMap[dayIso]) {
                dailyRatingsMap[dayIso] = { sum: 0, count: 0 };
            }
            dailyRatingsMap[dayIso].sum += b.rating_score;
            dailyRatingsMap[dayIso].count += 1;
            // --- End NEW population ---
        });

        const topBeers: TopBeer[] = Object.entries(beerTally)
            .map(([name, data]) => ({
                name,
                count: data.count,
                avgRating: data.ratingSum / data.count
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const sortedDates = Object.keys(dailyCountsMap).sort();
        const recentActivityByDate = sortedDates.map(date => ({
            date,
            count: dailyCountsMap[date]
        }));
        const checkinsByDay = [...recentActivityByDate]; // Use this for "Check-ins by Day (Last 7 Days)" if needed, or refine to actual daily checkins.

        function sortCounts(counts: Record<string, number>): Record<string, number> {
            return Object.fromEntries(
                Object.entries(counts).sort((a, b) => b[1] - a[1])
            );
        }

        // --- NEW: Convert maps to arrays for charts ---
        const dayOfWeekOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const checkinsByDayOfWeek: DayOfWeekCheckinCount[] = dayOfWeekOrder.map(day => ({
            day,
            count: dayOfWeekCountsMap[day] || 0
        }));

        const monthOrder = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const checkinsByMonth: MonthlyCheckinCount[] = monthOrder.map(month => ({
            month,
            count: monthCountsMap[month] || 0
        }));

        const averageRatingsOverTime: RatingOverTime[] = Object.keys(dailyRatingsMap)
            .sort() // Sort by date
            .map(date => ({
                date,
                rating: dailyRatingsMap[date].sum / dailyRatingsMap[date].count
            }));
        // --- End NEW conversion ---


        return {
            totalUniqueBeers,
            totalCheckins,
            newBeersCount,
            newBeerRatio,
            averageRating,
            totalUniqueBreweries,
            beerStylesCount,
            topBeers,
            checkinsByHour: hourly,
            topCountries: sortCounts(countryCounts),
            topStates: sortCounts(stateCounts),
            recentActivityByDate,
            checkinsByDay,
            checkinsByDayOfWeek,
            checkinsByMonth,
            averageRatingsOverTime
        };
    }
}