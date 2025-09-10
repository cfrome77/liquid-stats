import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseCardData } from '../../shared/components/card/card-data.interface';
import { DateUtils } from '../../shared/date-utils';

@Component({
  selector: 'app-wishlist',
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.css'],
})
export class WishlistComponent implements OnInit {
  public wishlist: any[] = [];
  public paginatedWishlist: BaseCardData[] = [];
  public currentPage: number = 1;
  public itemsPerPage: number = 10;
  public totalItems: number = 0;
  public isLoading: boolean = true;

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.fetchWishlistData();
  }

  private fetchWishlistData(): void {
    this.isLoading = true;
    this.getJSON().subscribe(
      (data) => {
        this.wishlist = data.response.beers.items;
        this.totalItems = this.wishlist.length;
        this.updatePaginatedWishlist();
        this.isLoading = false;
      },
      (error) => {
        console.error('Error fetching wishlist:', error);
        this.isLoading = false;
      }
    );
  }

  public getJSON(): Observable<any> {
    return this.http.get('https://liquid-stats.s3.amazonaws.com/wishlist.json');
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
        text: 'View Details',
        link: `https://untappd.com/b/${item.beer.beer_slug}/${item.beer.bid}`,
        timestamp: this.published(item.created_at),
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
      this.transformWishlistData(item)
    );
  }

  public published(createdAt: string | Date): string {
    return DateUtils.formatTimestamp(createdAt);
  }
}
