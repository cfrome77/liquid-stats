import { Component, OnInit, ChangeDetectorRef, inject } from "@angular/core";

import { BeerCheckin } from "src/app/core/models/beer.model";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { Router, RouterModule } from "@angular/router";
import { DataService } from "src/app/core/services/data.service";
import { DateUtils } from "../../core/utils/date-utils";
import { BaseCardData } from "../../shared/components/card/card-data.interface";
import { CardComponent } from "../../shared/components/card/card.component";
import { PaginationComponent } from "../../shared/components/pagination/pagination.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";

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
  ],
})
export class WishlistComponent implements OnInit {
  private dataService = inject(DataService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  public wishlist: BaseCardData[] = [];
  public paginatedWishlist: BaseCardData[] = [];
  public totalItems = 0;
  public currentPage = 1;
  public itemsPerPage = 10;

  ngOnInit(): void {
    this.dataService.getWishlist().subscribe({
      next: (data: unknown) => {
        const response = data as {
          response?: { beers?: { items?: unknown[] } };
        };
        const items = response?.response?.beers?.items || [];

        this.wishlist = items.map((item: unknown) =>
          this.transformWishlistData(item as BeerCheckin),
        );
        this.totalItems = this.wishlist.length;
        this.updatePagination();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error fetching wishlist:", err);
      },
    });
  }

  transformWishlistData(
    item: BeerCheckin & { created_at?: string },
  ): BaseCardData {
    return {
      title: item.beer.beer_name,
      subtitle: item.beer.beer_style,
      breweryName: item.brewery.brewery_name,
      description: item.beer.beer_description,
      mainImage: item.beer.beer_label,
      secondaryImage: item.brewery.brewery_label,
      footerInfo: {
        text: "Wishlist Item",
        link: `https://untappd.com/b/${item.beer.beer_slug}/${item.beer.bid}`,
        timestamp: item.created_at
          ? `Added ${DateUtils.formatTimestamp(item.created_at)}`
          : "Added long ago",
      },
    };
  }

  updatePagination() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;

    this.paginatedWishlist = this.wishlist.slice(startIndex, endIndex);
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.updatePagination();
    window.scrollTo(0, 0);
  }

  changeItemsPerPage(items: number) {
    this.itemsPerPage = items;
    this.currentPage = 1;
    this.updatePagination();
  }

  navigateToCheckins() {
    this.router.navigate(["/checkins"]);
  }
}
