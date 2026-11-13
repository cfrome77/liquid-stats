import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  inject,
  ChangeDetectorRef,
  DestroyRef,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
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
  private destroyRef = inject(DestroyRef);

  @ViewChild("carouselTrack") carouselTrack!: ElementRef;

  /** Number of check-ins shown in the "Recent Checkins" carousel. */
  private readonly RECENT_LIMIT = 12;

  /** Leading carousel images that load eagerly (above the fold on desktop). */
  readonly EAGER_IMAGE_COUNT = 4;

  allCheckins: Checkin[] = [];
  recentCheckins: Checkin[] = [];
  totalCheckins = 0;
  averageRating = 0;
  countriesTried = 0;
  breweriesVisited = 0;

  readonly DEFAULT_IMAGE =
    "https://placehold.co/400x400/2c2c2c/white?text=No+Photo";

  ngOnInit(): void {
    this.beerStore.load();

    this.beerStore.quickStats$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((stats) => {
        if (!stats) return;
        this.totalCheckins = stats.totalCheckins;
        this.averageRating = stats.averageRating;
        this.countriesTried = stats.countriesTried;
        this.breweriesVisited = stats.breweriesVisited;
        this.cdr.detectChanges();
      });

    this.beerStore.checkins$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((checkins) => {
        if (!checkins) return;
        this.allCheckins = checkins;
        this.recentCheckins = this.buildRecentCheckins(checkins);
        this.cdr.detectChanges();
      });

    this.beerStore.stats$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((stats) => {
        if (!stats) return;
        this.totalCheckins = stats.totalCheckins;
        this.averageRating = stats.averageRating;
        this.countriesTried = Object.keys(stats.topCountries).length;
        this.breweriesVisited = stats.totalUniqueBreweries;
        this.cdr.detectChanges();
      });
  }

  /** Newest check-ins first, capped so the carousel DOM stays small. */
  private buildRecentCheckins(checkins: Checkin[]): Checkin[] {
    return [...checkins]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .slice(0, this.RECENT_LIMIT);
  }

  scrollNext() {
    const track = this.carouselTrack.nativeElement;
    track.scrollBy({ left: track.clientWidth * 0.8, behavior: "smooth" });
  }

  scrollPrev() {
    const track = this.carouselTrack.nativeElement;
    track.scrollBy({ left: -track.clientWidth * 0.8, behavior: "smooth" });
  }

  /** Falls back to the placeholder, but only once, to avoid an error loop. */
  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    if (img.src !== this.DEFAULT_IMAGE) {
      img.src = this.DEFAULT_IMAGE;
    }
  }
}
