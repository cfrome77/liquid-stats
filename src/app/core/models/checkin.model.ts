export interface Checkin {
  checkin_id: number;
  created_at: string;
  checkin_comment: string;
  rating_score: number;
  beer: {
    bid: number;
    beer_name: string;
    beer_style: string;
    beer_label: string;
    beer_slug: string;
  };
  brewery: {
    brewery_id: number;
    brewery_name: string;
    brewery_label: string;
    location?: {
      lat: number;
      lng: number;
    };
    contact?: {
      twitter?: string;
      facebook?: string;
      [key: string]: any;
    };
  };
  venue?: {
    venue_id: number;
    venue_name: string;
  };
  badges?: {
    items: Array<{
      badge_name: string;
      badge_image: string;
    }>;
  };
}

export interface CheckinResponse {
  response: {
    checkins: {
      items: Checkin[];
    };
  };
}
