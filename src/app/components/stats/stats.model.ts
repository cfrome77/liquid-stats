export interface BeerCheckin {
    count?: number;
    first_created_at: string;
    recent_created_at: string;
    rating_score: number;
    beer: {
        beer_abv: number;
        bid: number;
        beer_label: string;
        beer_name: string;
        beer_style: string;
    };
    brewery: {
        location: {
            brewery_state: string;
        };
        brewery_name: string;
        country_name: string;
    };
    venue?: {
        venue_name?: string;
    };
}

export interface TopBeer {
    name: string;
    count: number;
    avgRating: number;
}

export interface DailyCheckinCount {
  date: string; // e.g., "YYYY-MM-DD"
  count: number;
}

export interface DayOfWeekCheckinCount {
  day: string; // e.g., "Sunday", "Monday", etc.
  count: number;
}

export interface MonthlyCheckinCount {
  month: string; // e.g., "Jan", "Feb", etc.
  count: number;
}

export interface RatingOverTime {
  date: string; // e.g., "YYYY-MM-DD"
  rating: number;
}

export interface ProcessedStats {
    totalUniqueBeers: number;
    totalCheckins: number;
    newBeersCount: number;
    newBeerRatio: number;
    averageRating: number;
    totalUniqueBreweries: number;
    beerStylesCount: Record<string, number>;
    topBeers: TopBeer[];
    checkinsByHour: number[];
    topCountries: Record<string, number>;
    topStates: Record<string, number>;
    recentActivityByDate: DailyCheckinCount[];
    checkinsByDay: DailyCheckinCount[];
    checkinsByDayOfWeek?: DayOfWeekCheckinCount[];
    checkinsByMonth?: MonthlyCheckinCount[];
    averageRatingsOverTime?: RatingOverTime[];
}