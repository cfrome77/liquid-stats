import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  inject,
} from "@angular/core";
import { CommonModule, NgOptimizedImage } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { RouterModule } from "@angular/router";

import { BeerStoreService } from "../../core/services/beer-store.service";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
  standalone: true,
  imports: [
    CommonModule,
    NgOptimizedImage,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    RouterModule,
  ],
})
export class HomeComponent implements OnInit {
  private beerStore = inject(BeerStoreService);

  @ViewChild("carouselTrack") carouselTrack!: ElementRef;

  allCheckins: any[] = [];
  totalCheckins = 0;
  averageRating = 0;
  countriesTried = 0;
  breweriesVisited = 0;

  readonly DEFAULT_IMAGE =
    "https://placehold.co/400x400/2c2c2c/white?text=No+Photo";

  ngOnInit(): void {
    this.beerStore.load();

    this.beerStore.beers$.subscribe((beers) => {
      if (!beers) return;

      this.allCheckins = beers;

      this.totalCheckins = beers.reduce((sum, b) => sum + (b.count ?? 1), 0);

      const ratings = beers.map((b) => b.rating_score);
      this.averageRating =
        ratings.reduce((a, b) => a + b, 0) / ratings.length || 0;

      this.countriesTried = new Set(
        beers.map((b) => b.brewery.country_name),
      ).size;

      this.breweriesVisited = new Set(
        beers.map((b) => b.brewery.brewery_name),
      ).size;
    });
  }

  scrollNext() {
    const track = this.carouselTrack.nativeElement;
    track.scrollBy({ left: track.clientWidth * 0.8, behavior: "smooth" });
  }

  scrollPrev() {
    const track = this.carouselTrack.nativeElement;
    track.scrollBy({ left: -track.clientWidth * 0.8, behavior: "smooth" });
  }

  handleImageError(event: Event) {
    (event.target as HTMLImageElement).src = this.DEFAULT_IMAGE;
  }
}
