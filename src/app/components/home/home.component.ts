import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { RouterLink, RouterModule } from "@angular/router";
import { CommonModule } from "@angular/common";
import { MatIconModule } from "@angular/material/icon";

import { DataService } from "../../core/services/data.service";
import { Checkin } from "../../core/models/checkin.model";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
  standalone: true,
  imports: [
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    RouterModule,
    RouterLink,
    CommonModule,
  ],
})
export class HomeComponent implements OnInit {
  recentBeers: {
    checkin_id: number;
    name: string;
    brewery: string;
    rating: number;
    image: string;
  }[] = [];

  totalCheckins: number = 0;
  averageRating: number = 0;
  countriesTried: number = 0;
  breweriesVisited: number = 0;

  // High-res placeholder for missing images
  private readonly DEFAULT_IMAGE =
    "https://placehold.co/400x400/2c2c2c/white?text=No+Photo";

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    // 1. Fetch Stats
    this.dataService.getBeers().subscribe({
      next: (res: any) => {
        const beerItems = Array.isArray(res?.beers) ? res.beers : [];
        this.totalCheckins = beerItems.reduce(
          (sum: number, b: any) => sum + (b.count || 1),
          0,
        );
        this.averageRating =
          beerItems.reduce(
            (sum: number, b: any) => sum + (b.rating_score || 0),
            0,
          ) / (beerItems.length || 1);
        this.countriesTried = new Set(
          beerItems.map((b: any) => b.brewery?.country_name || "Unknown"),
        ).size;
        this.breweriesVisited = new Set(
          beerItems.map((b: any) => b.brewery?.brewery_name || "Unknown"),
        ).size;
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error fetching beers:", err),
    });

    // 2. Fetch Recent Checkins
    this.dataService.getCheckins().subscribe({
      next: (res: any) => {
        const checkins: Checkin[] = Array.isArray(
          res?.response?.checkins?.items,
        )
          ? res.response.checkins.items
          : [];

        this.recentBeers = checkins
          .sort(
            (a, b) =>
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
          )
          .slice(0, 5)
          .map((c) => {
            // Priority: User Photo (Original) > User Photo (Large) > Beer Label > Placeholder
            let img = this.DEFAULT_IMAGE;
            if (c.media?.items?.length) {
              const photo = c.media.items[0].photo;
              img =
                photo.photo_img_og || photo.photo_img_lg || photo.photo_img_md;
            } else if (c.beer?.beer_label) {
              img = c.beer.beer_label;
            }

            return {
              checkin_id: c.checkin_id,
              name: c.beer?.beer_name || "Unknown",
              brewery: c.brewery?.brewery_name || "Unknown",
              rating: c.rating_score || 0,
              image: img,
            };
          });

        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error fetching checkins:", err),
    });
  }

  // Helper to handle broken image links dynamically
  handleImageError(event: any) {
    event.target.src = this.DEFAULT_IMAGE;
  }
}
