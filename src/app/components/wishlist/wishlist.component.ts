import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { Observable } from "rxjs";
import { BaseCardData } from "../../shared/components/card/card-data.interface";
import { DataService } from "src/app/core/services/data.service";
import { DateUtils } from "../../core/utils/date-utils";

@Component({
  selector: "app-wishlist",
  templateUrl: "./wishlist.component.html",
  styleUrls: ["./wishlist.component.css"],
  standalone: false,
})
export class WishlistComponent implements OnInit {
  public wishlist: any[] = [];
  public paginatedWishlist: BaseCardData[] = [];
  public currentPage = 1;
  public itemsPerPage = 10;
  public totalItems = 0;
  public isLoading = true;

  constructor(private dataService: DataService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.fetchWishlistData();
  }

  private fetchWishlistData(): void {
    this.isLoading = true;
    this.dataService.getWishlist().subscribe({
      next: (data) => {
        this.wishlist = data.response.beers.items;
        this.totalItems = this.wishlist.length;
        this.updatePaginatedWishlist();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error("Error fetching wishlist:", error);
        this.isLoading = false;
      },
      complete: () => {
        console.log("Badges fetch completed");
      },
    });
  }

  public transformWishlistData(item: any): BaseCardData {
    return {
      title: item.beer.beer_name,
      subtitle: item.beer.beer_style,
      breweryName: item.brewery.brewery_name,
      description: item.beer.beer_description,
      rating: item.beer.rating_score,
      globalRating: undefined,
      mainImage: item.beer.beer_label,
      secondaryImage: item.brewery.brewery_label,
      footerInfo: {
        text: "Brewery Info",
        link: `https://untappd.com${item.brewery.brewery_page_url}`,
        timestamp: this.published(item.created_at),
        rightLinkText: "Beer Details",
      },
      extraData: {
        socialLinks: item.brewery.contact,
        mapData: {
          lat: item.brewery?.location?.lat,
          lng: item.brewery?.location?.lng,
          breweryId: item.brewery?.brewery_id,
        },
      },
    };
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.updatePaginatedWishlist();
  }

  updatePaginatedWishlist(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const itemsToPaginate = this.wishlist.slice(startIndex, endIndex);
    this.paginatedWishlist = itemsToPaginate.map((item) =>
      this.transformWishlistData(item),
    );
  }

  public published(createdAt: string | Date): string {
    return DateUtils.formatTimestamp(createdAt);
  }
}
