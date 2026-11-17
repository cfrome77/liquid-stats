export interface BeerCheckin {
  count?: number;
  first_created_at: string;
  recent_created_at: string;
  rating_score: number;
  beer: {
    beer_abv: number;
    bid: number;
    beer_label: string;
    beer_label_hd?: string;
    beer_name: string;
    beer_style: string;
    beer_description?: string;
    beer_slug?: string;
    rating_score?: number;
  };
  brewery: {
    brewery_id?: number;
    brewery_label?: string;
    brewery_label_hd?: string;
    brewery_page_url?: string;
    contact?: {
      twitter?: string;
      facebook?: string;
      instagram?: string;
      url?: string;
    };
    location?: {
      lat?: number;
      lng?: number;
      brewery_state?: string;
      brewery_city?: string;
    };
    brewery_name: string;
    brewery_type?: string;
    country_name: string;
  };
  venue?: {
    venue_id?: number;
    venue_name?: string;
  };
  recent_checkin_id?: number;
}

/**
 * A wishlist entry as returned by `wishlist.json`. It reuses the beer/brewery
 * shape of {@link BeerCheckin} but carries no check-in metadata (counts,
 * timestamps, ratings), so it is modelled separately rather than reusing
 * BeerCheckin's required check-in fields.
 */
export interface WishlistBeer {
  beer: {
    bid: number;
    beer_name: string;
    beer_style: string;
    beer_label: string;
    beer_label_hd?: string;
    beer_slug: string;
    beer_description?: string;
    beer_abv?: number;
  };
  brewery: {
    brewery_id?: number;
    brewery_name: string;
    brewery_label?: string;
    brewery_label_hd?: string;
  };
  // Present on some payloads; absent in the bundled wishlist.json fixture.
  created_at?: string;
}

export interface WishlistResponse {
  response: {
    beers: {
      items: WishlistBeer[];
    };
  };
}
