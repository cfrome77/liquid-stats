import { MatIconModule } from "@angular/material/icon";
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { ActivatedRoute } from "@angular/router"; // Added
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { BadgeDialogComponent } from "../../shared/components/badge-dialog/badge-dialog.component";
import {
  BaseCardData,
  CardExtraData,
  MapData,
} from "../../shared/components/card/card-data.interface";
import { DataService } from "src/app/core/services/data.service";
import { environment } from "../../../environments/environment";

import { Checkin } from "src/app/core/models/checkin.model";
import { DateUtils } from "../../core/utils/date-utils";
import { CardComponent } from "../../shared/components/card/card.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";

@Component({
  selector: "app-checkins",
  templateUrl: "./checkins.component.html",
  styleUrls: ["./checkins.component.css"],
  standalone: true,
  imports: [
    MatIconModule,
    CommonModule,
    CardComponent,
    MatDialogModule,
    EmptyStateComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckinsComponent implements OnInit {
  public checkins: Checkin[] = [];
  public transformedCheckins: BaseCardData[] = [];
  username: string;

  constructor(
    private dataService: DataService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute, // Added
  ) {
    this.username = environment.UNTAPPD_USERNAME;
  }

  ngOnInit(): void {
    this.dataService.getCheckins().subscribe({
      next: (data) => {
        this.checkins = data.response.checkins.items;
        this.transformedCheckins = this.checkins.map((checkin) =>
          this.transformCheckinData(checkin),
        );

        this.cdr.markForCheck();

        // Check for ID in URL and scroll if present
        const targetId = this.route.snapshot.paramMap.get("id");
        if (targetId) {
          this.scrollToCheckin(targetId);
        }
      },
      error: (err) => {
        console.error("Error fetching checkins:", err);
      },
    });
  }

  private scrollToCheckin(id: string): void {
    // Small timeout to ensure DOM is rendered
    setTimeout(() => {
      const element = document.getElementById(`checkin-${id}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        element.classList.add("highlight-card");

        // Remove highlight class after animation finishes
        setTimeout(() => element.classList.remove("highlight-card"), 2500);
      }
    }, 200);
  }

  public published(createdAt: string | Date): string {
    return DateUtils.formatTimestamp(createdAt);
  }

  openBadgeDialog(badge: any): void {
    this.dialog.open(BadgeDialogComponent, {
      width: "400px",
      data: badge,
    });
  }

  transformCheckinData(checkin: Checkin): BaseCardData {
    const mapData: MapData | undefined = checkin.brewery?.location
      ? {
          lat: checkin.brewery.location.lat,
          lng: checkin.brewery.location.lng,
          breweryId: checkin.brewery.brewery_id,
        }
      : undefined;

    const extraData: CardExtraData = {
      badges: checkin.badges?.items ?? [],
      socialLinks: checkin.brewery.contact,
      mapData,
      venueId: checkin.venue?.venue_id,
      checkinId: checkin.checkin_id,
      userName: this.username,
    };

    return {
      title: checkin.beer.beer_name,
      subtitle: checkin.beer.beer_style,
      breweryName: checkin.brewery.brewery_name,
      description: checkin.checkin_comment,
      rating: checkin.rating_score,
      mainImage: checkin.beer.beer_label,
      secondaryImage: checkin.brewery.brewery_label,
      footerInfo: {
        text: checkin.venue?.venue_name ?? "Beer Info",
        link: checkin.venue
          ? `https://untappd.com/venue/${checkin.venue.venue_id}`
          : `https://untappd.com/b/${checkin.beer.beer_slug}/${checkin.beer.bid}`,
        timestamp: this.published(checkin.created_at),
        rightLinkText: "Checkin Details",
      },
      extraData,
    };
  }
}
