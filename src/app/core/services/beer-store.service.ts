import { Injectable, inject } from "@angular/core";
import { BehaviorSubject, map } from "rxjs";
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

  // 2. Load once
  load(): void {
    if (!this.beersSubject.value) {
      this.dataService.getBeersAll().subscribe((beers) => {
        this.beersSubject.next(beers);
      });
    }

    if (!this.checkinsSubject.value) {
      this.dataService.getCheckins().subscribe((response) => {
        const items = response.response.checkins.items || [];
        this.checkinsSubject.next(items);
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
