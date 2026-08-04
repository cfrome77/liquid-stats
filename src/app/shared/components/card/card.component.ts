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
  @Output() badgeClick = new EventEmitter<unknown>();

  readonly DEFAULT_IMAGE =
    "https://placehold.co/400x400/2c2c2c/white?text=No+Photo";

  onBadgeClick(badge: unknown): void {
    this.badgeClick.emit(badge);
  }
}
