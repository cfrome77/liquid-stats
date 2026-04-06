// src/app/core/models/badge.model.ts
import { BaseCardData } from "../../shared/components/card/card-data.interface";

export interface Badge {
  badge_name: string;
  badge_description: string;
  badge_hint: string;
  media: {
    badge_image_sm: string;
  };
  earned_at: string;
  user_badge_id: string | number;
}

export interface TransformedBadge extends BaseCardData {}
