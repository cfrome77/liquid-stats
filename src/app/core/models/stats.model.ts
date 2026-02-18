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
