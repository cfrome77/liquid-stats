import { MatIconModule } from "@angular/material/icon";
import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  NgZone,
  inject,
} from "@angular/core";

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
import { PaginationComponent } from "../../shared/components/pagination/pagination.component";

@Component({
  selector: "app-checkins",
  templateUrl: "./checkins.component.html",
  styleUrls: ["./checkins.component.css"],
  standalone: true,
  imports: [
    MatIconModule,
    CardComponent,
    MatDialogModule,
    EmptyStateComponent,
    PaginationComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckinsComponent implements OnInit {
  private dataService = inject(DataService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private ngZone = inject(NgZone);

  public checkinsInitial: Checkin[] = [];
  public checkinsAll: Checkin[] = [];
  public transformedCheckins: BaseCardData[] = [];
  public paginatedCheckins: BaseCardData[] = [];
  public totalItems = 0;
  public currentPage = 1;
  public itemsPerPage = 10;
  public hasLoadedAll = false;
  public isLoadingAll = false;
  username: string;

  constructor() {
    this.username = environment.UNTAPPD_USERNAME;
  }

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    this.dataService.getCheckins().subscribe({
      next: (data) => {
        const items = data.response.checkins.items || [];
        this.checkinsInitial = items;
        this.transformedCheckins = this.checkinsInitial.map((checkin) =>
          this.transformCheckinData(checkin),
        );
        this.totalItems = this.transformedCheckins.length;
        this.updatePagination();

        this.cdr.markForCheck();

        // Background load "all" checkins
        this.loadAllDataInBackground();

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

  loadAllDataInBackground(): void {
    if (this.hasLoadedAll || this.isLoadingAll) return;

    this.isLoadingAll = true;
    this.dataService.getCheckins().subscribe({
      next: (data) => {
        const items = data.response.checkins.items || [];
        this.checkinsAll = items;
        this.hasLoadedAll = true;
        this.isLoadingAll = false;

        // Since checkins.json is currently only 50 items anyway,
        // and we already loaded them in initial, this is more for future-proofing
        // or for when we get a real paginated checkins feed.

        this.transformedCheckins = this.checkinsAll.map((checkin) =>
          this.transformCheckinData(checkin),
        );
        this.totalItems = this.transformedCheckins.length;
        this.updatePagination();
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error("Error fetching all checkins in background:", err);
        this.isLoadingAll = false;
      },
    });
  }

  private scrollToCheckin(id: string): void {
    // Small timeout to ensure DOM is rendered
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => {
        const element = document.getElementById(`checkin-${id}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.classList.add("highlight-card");

          // Remove highlight class after animation finishes
          setTimeout(() => element.classList.remove("highlight-card"), 2500);
        }
      }, 200);
    });
  }

  public published(createdAt: string | Date): string {
    return DateUtils.formatTimestamp(createdAt);
  }

  openBadgeDialog(badge: unknown): void {
    this.dialog.open(BadgeDialogComponent, {
      width: "400px",
      data: badge,
    });
  }

  updatePagination() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedCheckins = this.transformedCheckins.slice(
      startIndex,
      endIndex,
    );
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.updatePagination();
    this.cdr.markForCheck();
    window.scrollTo(0, 0);
  }

  onItemsPerPageChange(size: number) {
    this.itemsPerPage = size;
    this.currentPage = 1;
    this.updatePagination();
    this.cdr.markForCheck();
  }

  transformCheckinData(checkin: Checkin): BaseCardData {
    const mapData: MapData | undefined =
      checkin.brewery?.location && checkin.brewery.brewery_id
        ? {
            lat: checkin.brewery.location.lat,
            lng: checkin.brewery.location.lng,
            breweryId: checkin.brewery.brewery_id.toString(),
          }
        : undefined;

    const extraData: CardExtraData = {
      badges:
        checkin.badges?.items.map((b) => ({
          badge_name: b.badge_name,
          badge_image: {
            sm: b.badge_image,
            md: b.badge_image,
            lg: b.badge_image,
          },
          badge_description: "",
          badge_hint: "",
          media: { badge_image_sm: b.badge_image },
          earned_at: "",
          user_badge_id: 0,
        })) ?? [],
      socialLinks: {
        facebook: checkin.brewery.contact?.facebook as string | undefined,
        url: checkin.brewery.contact?.url as string | undefined,
        instagram: checkin.brewery.contact?.instagram as string | undefined,
      },
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
