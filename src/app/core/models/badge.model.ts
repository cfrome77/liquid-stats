// src/app/core/models/badge.model.ts
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

export interface TransformedBadge {
  title: string;
  description: string;
  hint: string;
  mainImage: string;
  footerInfo: {
    timestamp: string;
    link: string;
    text: string;
  };
  extraData?: Record<string, unknown>;
}
