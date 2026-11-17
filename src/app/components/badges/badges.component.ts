import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject,
  signal,
  DestroyRef,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { ActivatedRoute, Router } from "@angular/router";
import { DataService } from "src/app/core/services/data.service";
import { Badge } from "src/app/core/models/badge.model";
import { LoggingService } from "src/app/core/services/logger.service";
import {
  DEFAULT_PER_PAGE,
  DEFAULT_VIEW,
  PER_PAGE_OPTIONS,
  VIEW_STATE_PARAMS,
  ViewMode,
  clampPage,
  parsePositiveInt,
  parseViewMode,
  viewStateParams,
} from "../../core/utils/view-state";
import { PaginationComponent } from "../../shared/components/pagination/pagination.component";
import { CardComponent } from "../../shared/components/card/card.component";
import { BaseCardData } from "../../shared/components/card/card-data.interface";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { SkeletonCardComponent } from "../../shared/components/skeleton-card/skeleton-card.component";
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
    SkeletonCardComponent,
  ],
})
export class BadgesComponent implements OnInit {
  public viewMode = signal<ViewMode>(DEFAULT_VIEW);
  private dataService = inject(DataService);
  private logger = inject(LoggingService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  public badges: Badge[] = [];
  public paginatedBadges: Badge[] = [];
  public hasLoadError = signal(false);
  public isLoading = true;

  public currentPage = 1;
  public itemsPerPage = DEFAULT_PER_PAGE;
  public totalItems = 0;

  ngOnInit(): void {
    this.syncFromQueryParams();
    this.loadBadges();
  }

  /** Restores view mode, page, and page size from the URL. */
  private syncFromQueryParams(): void {
    const params = this.route.snapshot.queryParamMap;
    this.viewMode.set(parseViewMode(params.get(VIEW_STATE_PARAMS.view)));
    this.itemsPerPage = parsePositiveInt(
      params.get(VIEW_STATE_PARAMS.perPage),
      DEFAULT_PER_PAGE,
      PER_PAGE_OPTIONS,
    );
    this.currentPage = parsePositiveInt(params.get(VIEW_STATE_PARAMS.page), 1);
  }

  /** Mirrors the current view state into the URL, replacing history entries. */
  private updateQueryParams(): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: viewStateParams({
        view: this.viewMode(),
        page: this.currentPage,
        perPage: this.itemsPerPage,
      }),
      queryParamsHandling: "merge",
      replaceUrl: true,
    });
  }

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
    this.updateQueryParams();
  }

  /** Fetches the earned badges, tracking a failure so the UI can retry. */
  private loadBadges(): void {
    this.isLoading = true;
    this.hasLoadError.set(false);
    this.dataService
      .getBadges()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data: Badge[]) => {
          this.badges = data;
          this.totalItems = this.badges.length;
          this.isLoading = false;
          this.updatePagination();
        },
        error: (err: unknown) => {
          this.logger.error("Error fetching badges", err);
          this.isLoading = false;
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
    const totalPages = Math.ceil(this.badges.length / this.itemsPerPage);
    this.currentPage = clampPage(this.currentPage, totalPages);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedBadges = this.badges.slice(startIndex, endIndex);
    this.cdr.detectChanges();
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.updatePagination();
    this.updateQueryParams();
  }

  onItemsPerPageChange(size: number) {
    this.itemsPerPage = size;
    this.currentPage = 1;
    this.updatePagination();
    this.updateQueryParams();
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
