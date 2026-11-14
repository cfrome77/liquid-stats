import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject,
  signal,
} from "@angular/core";

import { MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { DataService } from "src/app/core/services/data.service";
import { Badge } from "src/app/core/models/badge.model";
import { LoggingService } from "src/app/core/services/logger.service";
import { PaginationComponent } from "../../shared/components/pagination/pagination.component";
import { CardComponent } from "../../shared/components/card/card.component";
import { BaseCardData } from "../../shared/components/card/card-data.interface";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { DateUtils } from "src/app/core/utils/date-utils";

@Component({
  selector: "app-badges",
  templateUrl: "./badges.component.html",
  styleUrls: ["./badges.component.css"],
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    PaginationComponent,
    CardComponent,
    EmptyStateComponent,
  ],
})
export class BadgesComponent implements OnInit {
  public viewMode = signal<"cards" | "compact">("cards");
  private dataService = inject(DataService);
  private logger = inject(LoggingService);
  private cdr = inject(ChangeDetectorRef);

  public badges: Badge[] = [];
  public paginatedBadges: Badge[] = [];
  public hasLoadError = signal(false);

  public currentPage = 1;
  public itemsPerPage = 10;
  public totalItems = 0;

  ngOnInit(): void {
    this.loadBadges();
  }

  /** Fetches the earned badges, tracking a failure so the UI can retry. */
  private loadBadges(): void {
    this.hasLoadError.set(false);
    this.dataService.getBadges().subscribe({
      next: (data: Badge[]) => {
        this.badges = data;
        this.totalItems = this.badges.length;
        this.updatePagination();
      },
      error: (err: unknown) => {
        this.logger.error("Error fetching badges", err);
        this.hasLoadError.set(true);
        this.cdr.markForCheck();
      },
    });
  }

  /** Clears the cached response and retries the badges fetch. */
  retryLoad(): void {
    this.dataService.clearCache();
    this.loadBadges();
  }

  updatePagination() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedBadges = this.badges.slice(startIndex, endIndex);
    this.cdr.detectChanges();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.updatePagination();
  }

  onItemsPerPageChange(size: number) {
    this.itemsPerPage = size;
    this.currentPage = 1;
    this.updatePagination();
  }

  transformBadgeData(badge: Badge): BaseCardData {
    const formattedDate = DateUtils.formatTimestamp(badge.earned_at);

    return {
      title: badge.badge_name,
      // Untappd descriptions contain <a>/<strong>; [innerHTML] sanitizes them
      // (Angular strips scripts and event handlers) so no bypass is needed.
      description: badge.badge_description,
      mainImage: badge.media.badge_image_sm,
      footerInfo: {
        text: `Earned: ${formattedDate}`,
        link: undefined,
        timestamp: formattedDate,
      },
    };
  }
}
