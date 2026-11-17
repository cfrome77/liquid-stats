import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  ChangeDetectionStrategy,
  inject,
  signal,
  DestroyRef,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { CommonModule, NgOptimizedImage } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { RouterModule } from "@angular/router";

import { BeerStoreService } from "../../core/services/beer-store.service";
import {
  DEFAULT_IMAGE as DEFAULT_IMAGE_URL,
  applyDefaultImage,
} from "../../core/default-image";
import { Checkin } from "../../core/models/checkin.model";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  private destroyRef = inject(DestroyRef);

  @ViewChild("carouselTrack") carouselTrack!: ElementRef;

  /** Number of check-ins shown in the "Recent Checkins" carousel. */
  private readonly RECENT_LIMIT = 12;

  /** Leading carousel images that load eagerly (above the fold on desktop). */
  readonly EAGER_IMAGE_COUNT = 4;

  readonly allCheckins = signal<Checkin[]>([]);
  readonly recentCheckins = signal<Checkin[]>([]);
  readonly totalCheckins = signal(0);
  readonly averageRating = signal(0);
  readonly countriesTried = signal(0);
  readonly breweriesVisited = signal(0);

  readonly DEFAULT_IMAGE = DEFAULT_IMAGE_URL;

  ngOnInit(): void {
    this.beerStore.load();

    this.beerStore.quickStats$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((stats) => {
        if (!stats) return;
        this.totalCheckins.set(stats.totalCheckins);
        this.averageRating.set(stats.averageRating);
        this.countriesTried.set(stats.countriesTried);
        this.breweriesVisited.set(stats.breweriesVisited);
      });

    this.beerStore.checkins$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((checkins) => {
        if (!checkins) return;
        this.allCheckins.set(checkins);
        this.recentCheckins.set(this.buildRecentCheckins(checkins));
      });

    this.beerStore.stats$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((stats) => {
        if (!stats) return;
        this.totalCheckins.set(stats.totalCheckins);
        this.averageRating.set(stats.averageRating);
        this.countriesTried.set(Object.keys(stats.topCountries).length);
        this.breweriesVisited.set(stats.totalUniqueBreweries);
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

  /**
   * Walks a failed carousel image forward through its ordered fallback chain
   * (check-in photo -> HD label -> standard label -> bundled placeholder).
   * The handler locates the current src in the chain and advances exactly one
   * step, comparing resolved URLs so repeated or relatively-addressed
   * candidates cannot re-trigger it in an infinite loop.
   */
  handleImageError(
    event: Event,
    ...candidates: Array<string | undefined>
  ): void {
    const img = event.target as HTMLImageElement | null;
    if (!img) return;

    const chain = [
      ...new Set(
        [...candidates, DEFAULT_IMAGE_URL].filter(
          (url): url is string => !!url,
        ),
      ),
    ];
    const resolvedChain = chain.map((url) => this.resolveUrl(url, img));
    // An unrecognised src falls back to the first candidate, mirroring the
    // previous "retry the fallback" behaviour.
    const next = chain[resolvedChain.indexOf(img.src) + 1];

    if (next && this.resolveUrl(next, img) !== img.src) {
      img.src = next;
      return;
    }

    applyDefaultImage(event);
  }

  /** Resolves a candidate against the image's base so URLs compare absolutely. */
  private resolveUrl(url: string, img: HTMLImageElement): string {
    try {
      return new URL(url, img.baseURI).href;
    } catch {
      return url;
    }
  }
}
