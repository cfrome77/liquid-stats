import { Component, Input, Output, EventEmitter, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatChipsModule } from "@angular/material/chips";
import { RatingComponent } from "../rating/rating.component";
import { SocialLinksComponent } from "../social-links/social-links.component";

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
})
export class CardComponent implements OnInit {
  @Input() cardData: any;
  @Output() badgeClick = new EventEmitter<any>();

  constructor() {}

  ngOnInit(): void {}

  onBadgeClick(badge: any): void {
    this.badgeClick.emit(badge);
  }
}
