import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { RouterModule } from "@angular/router";
import { DataService } from "src/app/core/services/data.service";
import { DateUtils } from "../../core/utils/date-utils";
import { CardComponent } from "../../shared/components/card/card.component";
import { PaginationComponent } from "../../shared/components/pagination/pagination.component";

@Component({
  selector: "app-wishlist",
  templateUrl: "./wishlist.component.html",
  styleUrls: ["./wishlist.component.css"],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    RouterModule,
    CardComponent,
    PaginationComponent,
  ],
})
export class WishlistComponent implements OnInit {
  public wishlist: any[] = [];
  public paginatedWishlist: any[] = [];
  public totalItems = 0;
  public currentPage = 1;
  public itemsPerPage = 10;

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.dataService.getWishlist().subscribe({
      next: (data: any) => {
        const items = data?.response?.beers?.items || data?.response?.wishlist?.items || [];
        this.wishlist = items.map((item: any) =>
          this.transformWishlistData(item),
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

  transformWishlistData(item: any): any {
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
        timestamp: `Added ${DateUtils.formatTimestamp(item.created_at)}`,
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
}
