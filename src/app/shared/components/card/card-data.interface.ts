export interface MapData {
  lat?: number;
  lng?: number;
  breweryId?: number;
}

export interface CardExtraData {
  badges?: any[];
  socialLinks?: Record<string, any>;
  mapData?: MapData;
  venueId?: number;
  checkinId?: number;
  userName?: string;
}

// Base interface
export interface BaseCardData {
  title: string;
  subtitle?: string;
  breweryName?: string;
  description?: string;
  hint?: string;
  rating?: number;
  globalRating?: number;
  mainImage?: string;
  secondaryImage?: string;
  footerInfo: {
    text: string | undefined;
    link: string | undefined;
    timestamp: string;
    rightLinkText?: string;
  };
  extraData?: CardExtraData;
  rank?: number;
}
