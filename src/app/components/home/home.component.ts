import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { RouterModule } from "@angular/router";

import { DataService } from "../../core/services/data.service";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    RouterModule,
  ],
})
export class HomeComponent implements OnInit {
  @ViewChild("carouselTrack") carouselTrack!: ElementRef;

  allCheckins: any[] = [];
  totalCheckins = 0;
  averageRating = 0;
  countriesTried = 0;
  breweriesVisited = 0;

  readonly DEFAULT_IMAGE =
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
          beerItems.map((b: any) => b.brewery?.country_name),
        ).size;
        this.breweriesVisited = new Set(
          beerItems.map((b: any) => b.brewery?.brewery_name),
        ).size;
        this.cdr.detectChanges();
      },
    });

    // 2. Fetch Checkins (Full list for the scrollable track)
    this.dataService.getCheckins().subscribe({
      next: (res: any) => {
        this.allCheckins = res?.response?.checkins?.items || [];
        this.cdr.detectChanges();
      },
    });
  }

  // --- Native Scroll Controls ---
  scrollNext() {
    const track = this.carouselTrack.nativeElement;
    // Scrolls by the visible width of the container
    track.scrollBy({ left: track.clientWidth * 0.8, behavior: "smooth" });
  }

  scrollPrev() {
    const track = this.carouselTrack.nativeElement;
    track.scrollBy({ left: -track.clientWidth * 0.8, behavior: "smooth" });
  }

  handleImageError(event: any) {
    event.target.src = this.DEFAULT_IMAGE;
  }
}
