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
    beer_description?: string;
    beer_slug?: string;
    rating_score?: number;
  };
  brewery: {
    brewery_id?: number;
    brewery_label?: string;
    contact?: any;
    location: {
      lat?: number;
      lng?: number;
      brewery_state?: string;
    };
    brewery_name: string;
    country_name: string;
  };
  venue?: {
    venue_id?: number;
    venue_name?: string;
  };
  recent_checkin_id?: number;
}
