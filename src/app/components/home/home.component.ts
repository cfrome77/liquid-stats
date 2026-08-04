import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  inject,
  ChangeDetectorRef,
} from "@angular/core";
import { CommonModule, NgOptimizedImage } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { RouterModule } from "@angular/router";

import { BeerStoreService } from "../../core/services/beer-store.service";
import { Checkin } from "../../core/models/checkin.model";

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
  private cdr = inject(ChangeDetectorRef);

  @ViewChild("carouselTrack") carouselTrack!: ElementRef;

  allCheckins: Checkin[] = [];
  totalCheckins = 0;
  averageRating = 0;
  countriesTried = 0;
  breweriesVisited = 0;

  readonly DEFAULT_IMAGE =
    "https://placehold.co/400x400/2c2c2c/white?text=No+Photo";

  ngOnInit(): void {
    this.beerStore.load();

    this.beerStore.quickStats$.subscribe((stats) => {
      if (!stats) return;
      this.totalCheckins = stats.totalCheckins;
      this.averageRating = stats.averageRating;
      this.countriesTried = stats.countriesTried;
      this.breweriesVisited = stats.breweriesVisited;
      this.cdr.markForCheck();
    });

    this.beerStore.checkins$.subscribe((checkins) => {
      if (!checkins) return;
      this.allCheckins = checkins;
      this.cdr.markForCheck();
    });

    this.beerStore.stats$.subscribe((stats) => {
      if (!stats) return;

      this.totalCheckins = stats.totalCheckins;
      this.averageRating = stats.averageRating;
      this.countriesTried = Object.keys(stats.topCountries).length;
      this.breweriesVisited = stats.totalUniqueBreweries;
      this.cdr.markForCheck();
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
