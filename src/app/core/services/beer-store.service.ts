import { Injectable, inject } from "@angular/core";
import { BehaviorSubject, map, catchError, of } from "rxjs";
import { DataService } from "./data.service";
import { BeerCheckin } from "../models/beer.model";
import { Checkin, CheckinResponse } from "../models/checkin.model";
import { StatsService } from "../../components/stats/stats.service";
import { LoggingService } from "./logger.service";

export interface QuickStats {
  totalCheckins: number;
  averageRating: number;
  countriesTried: number;
  breweriesVisited: number;
  lastUpdated: string;
}

@Injectable({ providedIn: "root" })
export class BeerStoreService {
  private dataService = inject(DataService);
  private statsService = inject(StatsService);
  private logger = inject(LoggingService);

  // 1. Raw source of truth
  private beersSubject = new BehaviorSubject<BeerCheckin[] | null>(null);
  readonly beers$ = this.beersSubject.asObservable();

  private checkinsSubject = new BehaviorSubject<Checkin[] | null>(null);
  readonly checkins$ = this.checkinsSubject.asObservable();

  private quickStatsSubject = new BehaviorSubject<QuickStats | null>(null);
  readonly quickStats$ = this.quickStatsSubject.asObservable();

  private loadErrorSubject = new BehaviorSubject<boolean>(false);
  readonly loadError$ = this.loadErrorSubject.asObservable();

  private isLoadingBeers = false;
  private isLoadingCheckins = false;

  // 2. Derived stream: stats (always consistent).
  // Defined before methods to satisfy ESLint member-ordering.
  readonly stats$ = this.beers$.pipe(
    map((beers) => {
      if (!beers) return null;

      // use SAME logic everywhere
      const start = new Date(0);
      const end = new Date();

      return this.statsService.computeStats(beers, start, end);
    }),
  );

  // 3. Load once or force reload
  load(force: boolean = false): void {
    if (force) {
      this.logger.info("Forcing reload of all beer data store feeds.");
      this.loadErrorSubject.next(false);
      this.beersSubject.next(null);
      this.checkinsSubject.next(null);
      this.quickStatsSubject.next(null);
      this.isLoadingBeers = false;
      this.isLoadingCheckins = false;
    }

    if (!this.quickStatsSubject.value) {
      this.dataService
        .getStats()
        .pipe(
          catchError((err: unknown) => {
            this.logger.error("Error loading quick stats in beer store:", err);
            this.loadErrorSubject.next(true);
            return of(null);
          }),
        )
        .subscribe((stats) => {
          if (stats) {
            this.quickStatsSubject.next(stats as QuickStats);
          }
        });
    }

    if (!this.beersSubject.value && !this.isLoadingBeers) {
      this.isLoadingBeers = true;
      this.dataService
        .getBeersAll()
        .pipe(
          catchError((err: unknown) => {
            this.logger.error("Error loading beers in beer store:", err);
            this.isLoadingBeers = false;
            this.loadErrorSubject.next(true);
            return of([]);
          }),
        )
        .subscribe((beers) => {
          this.beersSubject.next(beers);
          this.isLoadingBeers = false;
        });
    }

    if (!this.checkinsSubject.value && !this.isLoadingCheckins) {
      this.isLoadingCheckins = true;
      this.dataService
        .getCheckins()
        .pipe(
          catchError((err: unknown) => {
            this.logger.error("Error loading checkins in beer store:", err);
            this.isLoadingCheckins = false;
            this.loadErrorSubject.next(true);
            const fallbackResponse: CheckinResponse = {
              response: { checkins: { items: [] } },
            };
            return of(fallbackResponse);
          }),
        )
        .subscribe((response) => {
          const items = response?.response?.checkins?.items || [];
          this.checkinsSubject.next(items);
          this.isLoadingCheckins = false;
        });
    }
  }
}
