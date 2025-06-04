import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { BeerCheckin, ProcessedStats } from './stats.model';

@Injectable({ providedIn: 'root' })
export class StatsService {
    constructor(private http: HttpClient) { }

    loadBeerData(): Observable<BeerCheckin[]> {
        const url = `https://liquid-stats.s3.amazonaws.com/beers.json?cb=${Date.now()}`; // cache-busting param
        return this.http.get<{ beers: BeerCheckin[] }>(url).pipe(
            map(data => data.beers)
        );
    }

    getDateRange(type: string, beers: BeerCheckin[], customStart?: Date | null, customEnd?: Date | null): { start: Date; end: Date } {
        const dates = beers.map(b => new Date(b.first_created_at));
        const minDate = new Date(Math.min(...dates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...dates.map(d => d.getTime())));
        const now = new Date();

        switch (type) {
            case 'week':
                return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7), end: now };
            case 'month':
                return { start: new Date(now.getFullYear(), now.getMonth() - 1, now.getDate()), end: now };
            case 'year':
                return { start: new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()), end: now };
            case 'custom':
                return { start: customStart || minDate, end: customEnd || maxDate };
            case 'all':
            default:
                return { start: minDate, end: maxDate };
        }
    }

    computeStats(beers: BeerCheckin[], start: Date, end: Date): ProcessedStats {
        // Filter beers checked in during date range (based on recent_created_at)
        const beersInRange = beers.filter(b => {
            const recentDate = new Date(b.recent_created_at);
            return recentDate >= start && recentDate <= end;
        });

        // Total unique beers checked in during range (by unique bid)
        const uniqueBeersSet = new Set(beersInRange.map(b => b.beer.bid));
        const totalUniqueBeers = uniqueBeersSet.size;

        // Total checkins: sum of count for beers in range
        const totalCheckins = beersInRange.reduce((sum, b) => sum + (b.count ?? 1), 0);

        // New beers: those whose first_created_at is within range
        const newBeersCount = beers.filter(b => {
            const firstDate = new Date(b.first_created_at);
            return firstDate >= start && firstDate <= end;
        }).filter(b => uniqueBeersSet.has(b.beer.bid)).length;

        const newBeerRatio = totalUniqueBeers > 0 ? newBeersCount / totalUniqueBeers : 0;

        // Average rating: weighted by count (or default count 1)
        const totalRatingSum = beersInRange.reduce((sum, b) => sum + b.rating_score * (b.count ?? 1), 0);
        const averageRating = totalCheckins > 0 ? totalRatingSum / totalCheckins : 0;

        // Unique breweries in range
        const uniqueBreweriesSet = new Set(beersInRange.map(b => b.brewery.brewery_name));
        const totalUniqueBreweries = uniqueBreweriesSet.size;

        // Beer style breakdown (counts)
        const beerStylesCount: Record<string, number> = {};
        beersInRange.forEach(b => {
            const style = b.beer.beer_style || 'Unknown';
            const c = b.count ?? 1;
            beerStylesCount[style] = (beerStylesCount[style] || 0) + c;
        });

        return {
            totalUniqueBeers,
            totalCheckins,
            newBeersCount,
            newBeerRatio,
            averageRating,
            totalUniqueBreweries,
            beerStylesCount,
        };
    }
}
