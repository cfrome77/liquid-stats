import {
  Component,
  Input,
  Output,
  EventEmitter,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatChipsModule } from "@angular/material/chips";
import { RatingComponent } from "../rating/rating.component";
import { SocialLinksComponent } from "../social-links/social-links.component";
import { BaseCardData } from "./card-data.interface";
import { DEFAULT_IMAGE as DEFAULT_IMAGE_URL } from "../../../core/default-image";

@Component({
  selector: "app-card",
  templateUrl: "./card.component.html",
  styleUrls: ["./card.component.css"],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatChipsModule,
    RatingComponent,
    SocialLinksComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  @Input() cardData!: BaseCardData;
  @Input() viewMode: "cards" | "compact" = "cards";
  @Output() badgeClick = new EventEmitter<unknown>();

  get hasSocialLinks(): boolean {
    const links = this.cardData?.extraData?.socialLinks;
    const mapData = this.cardData?.extraData?.mapData;
    return !!(links?.url || links?.facebook || links?.instagram || mapData);
  }

  get canShare(): boolean {
    return typeof navigator !== "undefined" && !!navigator.share;
  }

  onBadgeClick(badge: unknown): void {
    this.badgeClick.emit(badge);
  }

  /**
   * Walks an image down a fallback chain: high-res variant -> standard variant
   * -> bundled placeholder. Compares against the markup `src` (not the
   * resolved `img.src`) and stops when the target is unchanged, so a broken
   * fallback can never re-trigger the handler in a loop.
   */
  handleImageError(event: Event, fallback?: string): void {
    const img = event.target as HTMLImageElement | null;
    if (!img) return;

    const current = img.getAttribute("src");
    if (fallback && fallback !== current) {
      img.src = fallback;
      return;
    }
    if (current !== DEFAULT_IMAGE_URL) {
      img.src = DEFAULT_IMAGE_URL;
    }
  }

  async shareCheckin(event: Event): Promise<void> {
    event.preventDefault();
    if (this.canShare) {
      try {
        await navigator.share({
          title: this.cardData?.title || "Liquid Stats Checkin",
          text: `${this.cardData?.title} by ${this.cardData?.breweryName}`,
          url: this.cardData?.footerInfo?.link || window.location.href,
        });
      } catch {
        // User cancelled share or share failed silently
      }
    }
  }
}
