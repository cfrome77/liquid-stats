// Base interface for all card types
export interface BaseCardData {
  title: string;
  subtitle?: string;
  breweryName?: string;
  description?: string;
  rating?: number;
  mainImage?: string;
  secondaryImage?: string;
  footerInfo: {
    text: string;
    link: string;
    timestamp: string;
  };
  extraData?: {
    badges?: any[];
    socialLinks?: any;
    mapData?: any;
    venueId?: number;
    checkinId?: number;
    userName?: string;
  };
}