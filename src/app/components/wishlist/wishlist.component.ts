import {
  Component,
  OnInit,
  ChangeDetectorRef,
  inject,
  signal,
  DestroyRef,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { WishlistBeer } from "src/app/core/models/beer.model";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { DataService } from "src/app/core/services/data.service";
import { LoggingService } from "src/app/core/services/logger.service";
import { DateUtils } from "../../core/utils/date-utils";
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
import { BaseCardData } from "../../shared/components/card/card-data.interface";
import { CardComponent } from "../../shared/components/card/card.component";
import { PaginationComponent } from "../../shared/components/pagination/pagination.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import { SkeletonCardComponent } from "../../shared/components/skeleton-card/skeleton-card.component";
import { thumbnailLabel } from "../../core/utils/label-image";

@Component({
  selector: "app-wishlist",
  templateUrl: "./wishlist.component.html",
  styleUrls: ["./wishlist.component.css"],
  standalone: true,
  imports: [
    MatButtonModule,
    MatIconModule,
    RouterModule,
    CardComponent,
    PaginationComponent,
    EmptyStateComponent,
    SkeletonCardComponent,
  ],
})
export class WishlistComponent implements OnInit {
  private dataService = inject(DataService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private logger = inject(LoggingService);
  private destroyRef = inject(DestroyRef);

  public viewMode = signal<ViewMode>(DEFAULT_VIEW);
  public wishlist: BaseCardData[] = [];
  public paginatedWishlist: BaseCardData[] = [];
  public totalItems = 0;
  public currentPage = 1;
  public itemsPerPage = DEFAULT_PER_PAGE;
  public hasLoadError = signal(false);
  public isLoading = true;

  ngOnInit(): void {
    this.syncFromQueryParams();
    this.loadWishlist();
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

  /** Fetches the wishlist, tracking a failure so the UI can retry. */
  private loadWishlist(): void {
    this.isLoading = true;
    this.hasLoadError.set(false);
    this.dataService
      .getWishlist()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          const items = data.response.beers.items;

          this.wishlist = items.map((item) => this.transformWishlistData(item));
          this.totalItems = this.wishlist.length;
          this.isLoading = false;
          this.updatePagination();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.logger.error("Error fetching wishlist", err);
          this.isLoading = false;
          this.hasLoadError.set(true);
          this.cdr.markForCheck();
        },
      });
  }

  /** Clears the cached response and retries the wishlist fetch. */
  retryLoad(): void {
    this.dataService.clearCache();
    this.loadWishlist();
  }

  transformWishlistData(item: WishlistBeer): BaseCardData {
    return {
      title: item.beer.beer_name,
      subtitle: item.beer.beer_style,
      breweryName: item.brewery.brewery_name,
      description: item.beer.beer_description,
      mainImage: thumbnailLabel(item.beer.beer_label, item.beer.beer_label_hd),
      secondaryImage: thumbnailLabel(
        item.brewery.brewery_label,
        item.brewery.brewery_label_hd,
      ),
      footerInfo: {
        text: "Wishlist Item",
        link: `https://untappd.com/b/${item.beer.beer_slug}/${item.beer.bid}`,
        timestamp: item.created_at
          ? `Added ${DateUtils.formatTimestamp(item.created_at)}`
          : "Added long ago",
      },
      extraData: {
        originalMainImage: item.beer.beer_label_hd || item.beer.beer_label,
        originalSecondaryImage:
          item.brewery.brewery_label_hd || item.brewery.brewery_label,
      },
    };
  }

  updatePagination() {
    const totalPages = Math.ceil(this.wishlist.length / this.itemsPerPage);
    this.currentPage = clampPage(this.currentPage, totalPages);
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;

    this.paginatedWishlist = this.wishlist.slice(startIndex, endIndex);
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.updatePagination();
    this.updateQueryParams();
    window.scrollTo(0, 0);
  }

  changeItemsPerPage(items: number) {
    this.itemsPerPage = items;
    this.currentPage = 1;
    this.updatePagination();
    this.updateQueryParams();
  }

  navigateToCheckins() {
    this.router.navigate(["/checkins"]);
  }
}
