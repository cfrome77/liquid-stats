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
    country_name: string;
    location?: {
      lat: number;
      lng: number;
    };
    contact?: {
      twitter?: string;
      facebook?: string;
      [key: string]: string | number | boolean | undefined;
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
  media?: {
    count: number;
    items: Array<{
      photo: {
        photo_img_sm: string;
        photo_img_md: string;
        photo_img_lg: string;
        photo_img_og: string;
      };
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
