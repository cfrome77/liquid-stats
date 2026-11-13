import { Badge } from "src/app/core/models/badge.model";

export interface MapData {
  lat: number;
  lng: number;
  breweryId: string;
}

export interface SocialLinks {
  url?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
}

export interface CardExtraData {
  badges?: Badge[];
  socialLinks?: SocialLinks;
  mapData?: MapData;
  venueId?: number;
  checkinId?: number;
  userName?: string;
  originalMainImage?: string;
  originalSecondaryImage?: string;
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
