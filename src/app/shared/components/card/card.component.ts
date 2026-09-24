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
  @Input() viewMode: "grid" | "compact" = "grid";
  @Output() badgeClick = new EventEmitter<unknown>();

  readonly DEFAULT_IMAGE =
    "https://placehold.co/400x400/2c2c2c/white?text=No+Photo";

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
