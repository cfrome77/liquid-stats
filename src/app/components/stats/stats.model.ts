export interface BeerCheckin {
    count?: number;
    first_created_at: string;
    recent_created_at: string; 
    rating_score: number;
    beer: {
        beer_abv: any;
        bid: number;
        beer_label: any;
        beer_name: string;
        beer_style: string;
    };
    brewery: {
        brewery_name: string;
        country_name: string;
    };
    venue?: {
        venue_name?: string;
    };
}

export interface ProcessedStats {
    totalUniqueBeers: number;       // Unique beers with recent_created_at in the date range
    totalCheckins: number;           // Sum of count fields for beers with recent_created_at in range
    newBeersCount: number;           // Beers with first_created_at in date range
    newBeerRatio: number;            // newBeersCount / totalUniqueBeers
    averageRating: number;           // Average rating_score (weighted by count or simple average) for beers in range
    totalUniqueBreweries: number;   // Breweries from beers with recent_created_at in range
    beerStylesCount: Record<string, number>; // Map beer style => count (for style breakdown)
}
