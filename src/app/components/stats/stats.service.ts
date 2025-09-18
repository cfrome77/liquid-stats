import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { BeerCheckin, ProcessedStats, TopBeer, DayOfWeekCheckinCount, MonthlyCheckinCount, RatingOverTime } from './stats.model';
import { DataService } from 'src/app/core/services/data.service';
import { DateUtils } from '../../core/utils/date-utils';

@Injectable({ providedIn: 'root' })
export class StatsService {
    constructor(private dataService: DataService) { }

    loadBeerData(): Observable<BeerCheckin[]> {
        return this.dataService.getBeers().pipe(
            map(data => data.beers || data)
        );
    }

    computeStats(beers: BeerCheckin[], start: Date, end: Date): ProcessedStats {
        const beersInRange = beers.filter(b => {
            const date = DateUtils.parseDate(b.recent_created_at);
            return date >= start && date <= end;
        });

        const uniqueBeersSet = new Set(beersInRange.map(b => b.beer.bid));
        const totalUniqueBeers = uniqueBeersSet.size;

        const totalCheckins = beersInRange.reduce((sum, b) => sum + (b.count ?? 1), 0);

        const newBeersCount = beers.filter(b => {
            const firstDate = DateUtils.parseDate(b.first_created_at);
            return firstDate >= start && firstDate <= end && uniqueBeersSet.has(b.beer.bid);
        }).length;

        const newBeerRatio = totalUniqueBeers > 0 ? newBeersCount / totalUniqueBeers : 0;

        const totalRatingSum = beersInRange.reduce((sum, b) => sum + b.rating_score * (b.count ?? 1), 0);
        const averageRating = totalCheckins > 0 ? totalRatingSum / totalCheckins : 0;

        const uniqueBreweriesSet = new Set(beersInRange.map(b => b.brewery.brewery_name));
        const totalUniqueBreweries = uniqueBreweriesSet.size;

        const beerStylesCount: Record<string, number> = {};
        const hourly: number[] = new Array(24).fill(0);
        const beerTally: Record<string, { count: number; ratingSum: number }> = {};
        const countryCounts: Record<string, number> = {};
        const stateCounts: Record<string, number> = {};
        const dailyCountsMap: Record<string, number> = {};
        const dayOfWeekCountsMap: Record<string, number> = {
            'Sunday': 0, 'Monday': 0, 'Tuesday': 0, 'Wednesday': 0,
            'Thursday': 0, 'Friday': 0, 'Saturday': 0
        };
        const monthCountsMap: Record<string, number> = {
            'Jan': 0, 'Feb': 0, 'Mar': 0, 'Apr': 0, 'May': 0, 'Jun': 0,
            'Jul': 0, 'Aug': 0, 'Sep': 0, 'Oct': 0, 'Nov': 0, 'Dec': 0
        };
        const dailyRatingsMap: Record<string, { sum: number; count: number }> = {};

        beersInRange.forEach(b => {
            const count = b.count ?? 1;
            const style = b.beer.beer_style || 'Unknown';
            const checkinDate = DateUtils.parseDate(b.recent_created_at);
            const hour = checkinDate.getHours();
            const name = b.beer.beer_name;

            // Count styles
            beerStylesCount[style] = (beerStylesCount[style] || 0) + count;

            // Hourly checkins
            hourly[hour] += count;

            // Beer tally for top beers
            if (!beerTally[name]) beerTally[name] = { count: 0, ratingSum: 0 };
            beerTally[name].count += count;
            beerTally[name].ratingSum += b.rating_score * count;

            // Country and state counts
            const country = b.brewery.country_name || 'Unknown';
            countryCounts[country] = (countryCounts[country] || 0) + count;

            const state = b.brewery.location.brewery_state || 'Unknown';
            stateCounts[state] = (stateCounts[state] || 0) + count;

            // Daily counts (YYYY-MM-DD)
            const dayIso = DateUtils.toISODate(checkinDate);
            dailyCountsMap[dayIso] = (dailyCountsMap[dayIso] || 0) + count;

            // Day of week
            const dayOfWeek = checkinDate.toLocaleDateString('en-US', { weekday: 'long' });
            dayOfWeekCountsMap[dayOfWeek] = (dayOfWeekCountsMap[dayOfWeek] || 0) + count;

            // Month
            const month = checkinDate.toLocaleDateString('en-US', { month: 'short' });
            monthCountsMap[month] = (monthCountsMap[month] || 0) + count;

            // Average ratings over time
            if (!dailyRatingsMap[dayIso]) dailyRatingsMap[dayIso] = { sum: 0, count: 0 };
            dailyRatingsMap[dayIso].sum += b.rating_score;
            dailyRatingsMap[dayIso].count += 1;
        });

        const topBeers: TopBeer[] = Object.entries(beerTally)
            .map(([name, data]) => ({ name, count: data.count, avgRating: data.ratingSum / data.count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        const sortedDates = Object.keys(dailyCountsMap).sort();
        const recentActivityByDate = sortedDates.map(date => ({ date, count: dailyCountsMap[date] }));
        const checkinsByDay = [...recentActivityByDate];

        function sortCounts(counts: Record<string, number>): Record<string, number> {
            return Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]));
        }

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
            .sort()
            .map(date => ({ date, rating: dailyRatingsMap[date].sum / dailyRatingsMap[date].count }));

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
