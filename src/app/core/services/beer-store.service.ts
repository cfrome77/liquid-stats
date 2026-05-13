import { Injectable, inject } from "@angular/core";
import { BehaviorSubject, map, catchError, of } from "rxjs";
import { DataService } from "./data.service";
import { BeerCheckin } from "../models/beer.model";
import { Checkin } from "../models/checkin.model";
import { StatsService } from "../../components/stats/stats.service";

@Injectable({ providedIn: "root" })
export class BeerStoreService {
  private dataService = inject(DataService);
  private statsService = inject(StatsService);

  // 1. Raw source of truth
  private beersSubject = new BehaviorSubject<BeerCheckin[] | null>(null);
  readonly beers$ = this.beersSubject.asObservable();

  private checkinsSubject = new BehaviorSubject<Checkin[] | null>(null);
  readonly checkins$ = this.checkinsSubject.asObservable();

  private isLoadingBeers = false;
  private isLoadingCheckins = false;

  // 2. Load once
  load(): void {
    if (!this.beersSubject.value && !this.isLoadingBeers) {
      this.isLoadingBeers = true;
      this.dataService
        .getBeersAll()
        .pipe(
          catchError((err) => {
            console.error("Error loading beers:", err);
            this.isLoadingBeers = false;
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
          catchError((err) => {
            console.error("Error loading checkins:", err);
            this.isLoadingCheckins = false;
            return of({ response: { checkins: { items: [] } } } as any);
          }),
        )
        .subscribe((response) => {
          const items = response?.response?.checkins?.items || [];
          this.checkinsSubject.next(items);
          this.isLoadingCheckins = false;
        });
    }
  }

  // 3. Derived stream: stats (always consistent)
  readonly stats$ = this.beers$.pipe(
    map((beers) => {
      if (!beers) return null;

      // use SAME logic everywhere
      const start = new Date(0);
      const end = new Date();

      return this.statsService.computeStats(beers, start, end);
    }),
  );

}
