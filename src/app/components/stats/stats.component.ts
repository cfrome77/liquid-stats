import {
  Component,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  effect,
  ChangeDetectionStrategy,
  inject,
} from "@angular/core";
import { DecimalPipe } from "@angular/common";
import { FormsModule, ReactiveFormsModule, FormControl } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatDatepickerModule } from "@angular/material/datepicker";
import {
  MatNativeDateModule,
  provideNativeDateAdapter,
} from "@angular/material/core";
import { MatInputModule } from "@angular/material/input";
import { MatIconModule } from "@angular/material/icon";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import {
  BaseChartDirective,
  provideCharts,
  withDefaultRegisterables,
} from "ng2-charts";
import { ChartData, ChartOptions } from "chart.js";
import { Subscription } from "rxjs";

import { StatsService } from "./stats.service";
import { BeerCheckin } from "src/app/core/models/beer.model";
import { ProcessedStats } from "src/app/core/models/stats.model";
import {
  BeerStyleDialogComponent,
  GenericBeersDialogData,
} from "../../shared/components/beer-style-dialog/beer-style-dialog.component";
import { DateUtils } from "../../core/utils/date-utils";
import { ThemeService } from "src/app/core/services/theme.service";
import { BeerStoreService } from "src/app/core/services/beer-store.service";
import { environment } from "src/environments/environment";

@Component({
  selector: "app-stats",
  templateUrl: "./stats.component.html",
  styleUrls: ["./stats.component.css"],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatInputModule,
    MatIconModule,
    MatDialogModule,
    BaseChartDirective,
  ],
  providers: [
    DecimalPipe,
    provideCharts(withDefaultRegisterables()),
    provideNativeDateAdapter(),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatsComponent implements OnInit, OnDestroy {
  private statsService = inject(StatsService);
  private beerStore = inject(BeerStoreService);
  private dialog = inject(MatDialog);
  private themeService = inject(ThemeService);
  private cdr = inject(ChangeDetectorRef);

  private beerSub?: Subscription;

  beers: BeerCheckin[] = [];
  processedStats: ProcessedStats | null = null;
  sortedBeerStyles: string[] = [];

  dateRange = new FormControl("year");
  customStartDate = new FormControl(DateUtils.subtractDays(365));
  customEndDate = new FormControl(new Date());

  // ---------------- CHART SETUP ----------------

  hourChartLabels: string[] = Array.from({ length: 24 }, (_, i) =>
    i.toString(),
  );

  hourChartData: ChartData<"bar", number[], string> = {
    labels: this.hourChartLabels,
    datasets: [
      {
        label: "Check-ins by Hour",
        data: [],
        backgroundColor: "rgba(63,81,181,0.8)",
      },
    ],
  };

  recentActivityChartData: ChartData<"line", number[], string> = {
    labels: [],
    datasets: [],
  };

  dayChartData: ChartData<"bar", number[], string> = {
    labels: [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ],
    datasets: [
      {
        data: [],
        label: "Check-ins by Day of Week",
        backgroundColor: "rgba(255,167,38,0.8)",
      },
    ],
  };

  monthChartData: ChartData<"bar", number[], string> = {
    labels: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    datasets: [
      {
        data: [],
        label: "Check-ins by Month",
        backgroundColor: "rgba(171,71,188,0.8)",
      },
    ],
  };

  ratingChartData: ChartData<"line", number[], string> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: "Average Rating",
        borderColor: "rgba(255,82,82,0.9)",
        fill: false,
      } as any,
    ],
  };

  chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
  };

  objectKeys = Object.keys;

  constructor() {
    effect(() => {
      const theme = this.themeService.currentTheme();
      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    this.beerStore.load();

    this.beerSub = this.beerStore.beers$.subscribe((data) => {
      this.beers = data ?? [];
      this.onDateChange();
      this.cdr.markForCheck();
    });

    this.dateRange.valueChanges.subscribe(() => this.onDateChange());
    this.customStartDate.valueChanges.subscribe(() => this.onDateChange());
    this.customEndDate.valueChanges.subscribe(() => this.onDateChange());
  }

  ngOnDestroy(): void {
    this.beerSub?.unsubscribe();
  }

  // ---------------- SINGLE SOURCE OF TRUTH ----------------

  private getDateRange(): { start: Date; end: Date } {
    const range = this.dateRange.value;
    let start: Date;
    let end: Date = new Date();

    if (range === "custom") {
      start = this.customStartDate.value
        ? new Date(this.customStartDate.value)
        : new Date("2000-01-01");

      end = this.customEndDate.value
        ? new Date(this.customEndDate.value)
        : new Date();

      return { start, end };
    }

    switch (range) {
      case "week":
        start = DateUtils.subtractDays(7);
        break;
      case "month":
        start = DateUtils.subtractMonths(1);
        break;
      case "year":
        start = DateUtils.subtractMonths(12);
        break;
      case "all":
      default:
        start = new Date("2000-01-01");
        break;
    }

    return { start, end };
  }

  // ---------------- MAIN UPDATE ----------------

  onDateChange(): void {
    if (!this.beers.length) {
      this.processedStats = null;
      return;
    }

    const { start, end } = this.getDateRange();

    this.processedStats = this.statsService.computeStats(
      this.beers,
      start,
      end,
    );

    const stats = this.processedStats;

    this.sortedBeerStyles = Object.keys(stats.beerStylesCount || {}).sort(
      (a, b) => stats.beerStylesCount[b] - stats.beerStylesCount[a],
    );

    this.updateCharts();
    this.cdr.markForCheck();
  }

  // ---------------- CHARTS ----------------

  private updateCharts(): void {
    const stats = this.processedStats;
    if (!stats) return;

    this.hourChartData = {
      labels: this.hourChartLabels,
      datasets: [
        {
          data: stats.checkinsByHour ?? [],
          label: "Check-ins by Hour",
        },
      ],
    };

    this.recentActivityChartData = {
      labels: (stats.recentActivityByDate ?? []).map((d) => d.date),
      datasets: [
        {
          data: (stats.recentActivityByDate ?? []).map((d) => d.count),
          label: "Beers Checked In",
        },
      ],
    };

    this.dayChartData = {
      labels: [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ],
      datasets: [
        {
          data: (stats.checkinsByDayOfWeek ?? []).map((d) => d.count),
          label: "Check-ins by Day of Week",
          backgroundColor: "rgba(255,167,38,0.8)",
        },
      ],
    };

    this.monthChartData = {
      labels: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      datasets: [
        {
          data: (stats.checkinsByMonth ?? []).map((m) => m.count),
          label: "Check-ins by Month",
          backgroundColor: "rgba(171,71,188,0.8)",
        },
      ],
    };

    this.ratingChartData = {
      labels: (stats.averageRatingsOverTime ?? []).map((d) => d.date),
      datasets: [
        {
          data: (stats.averageRatingsOverTime ?? []).map((d) => d.rating),
          label: "Average Rating",
        },
      ],
    };

    this.cdr.markForCheck();
  }

  // ---------------- CLICK HANDLERS ----------------

  openBeersByStyle(style: string) {
    this.openGeneric(style, (b) => b.beer.beer_style === style);
  }

  openBeersByTopBeer(name: string) {
    this.openGeneric(name, (b) => b.beer.beer_name === name);
  }

  openBeersByCountry(country: string) {
    this.openGeneric(country, (b) => b.brewery.country_name === country);
  }

  openBeersByState(state: string) {
    this.openGeneric(state, (b) => b.brewery.location?.brewery_state === state);
  }

  private openGeneric(title: string, filterFn: (b: BeerCheckin) => boolean) {
    const { start, end } = this.getDateRange();

    const filtered = this.beers.filter((b) => {
      const d = DateUtils.parseDate(b.recent_created_at);
      return filterFn(b) && d >= start && d <= end;
    });

    const data: GenericBeersDialogData = {
      title,
      beers: filtered.map((b) => ({
        beerName: b.beer.beer_name,
        beerLabel:
          b.beer.beer_label &&
          (b.beer.beer_label.includes("untappd.com") ||
            b.beer.beer_label.includes("untp.beer"))
            ? b.beer.beer_label.replace(/_(lg|md)\./, "_sm.")
            : b.beer.beer_label,
        breweryName: b.brewery.brewery_name,
        beerABV: b.beer.beer_abv,
        rating: b.rating_score,
        checkInDate: b.recent_created_at,
        checkinUrl:
          environment.UNTAPPD_USERNAME && b.recent_checkin_id
            ? `https://untappd.com/user/${environment.UNTAPPD_USERNAME}/checkin/${b.recent_checkin_id}`
            : undefined,
      })),
    };

    this.dialog.open(BeerStyleDialogComponent, {
      data,
      width: "350px",
      maxHeight: "80vh",
    });
  }
}
