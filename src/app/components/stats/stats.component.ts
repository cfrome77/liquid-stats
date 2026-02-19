import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { FormControl } from "@angular/forms";
import { StatsService } from "./stats.service";
import { BeerCheckin } from "src/app/core/models/beer.model";
import { ProcessedStats } from "src/app/core/models/stats.model";
import {
  BeerStyleDialogComponent,
  GenericBeersDialogData,
} from "../../shared/components/beer-style-dialog/beer-style-dialog.component";
import { MatDialog } from "@angular/material/dialog";
import { ChartData, ChartOptions } from "chart.js";
import { DateUtils } from "../../core/utils/date-utils";
import { ThemeService } from "src/app/core/services/theme.service";
import { Subscription } from "rxjs";

@Component({
  selector: "app-stats",
  templateUrl: "./stats.component.html",
  styleUrls: ["./stats.component.css"],
  standalone: false,
})
export class StatsComponent implements OnInit {
  beers: BeerCheckin[] = [];
  processedStats: ProcessedStats | null = null;

  dateRange = new FormControl("year");
  customStartDate = new FormControl(
    DateUtils.toISODate(DateUtils.subtractDays(365)),
  );
  customEndDate = new FormControl(DateUtils.toISODate(new Date()));

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

  recentActivityChartLabels: string[] = [];
  recentActivityChartData: ChartData<"line", number[], string> = {
    labels: [],
    datasets: [],
  };
  checkinsByDayLabels: string[] = [];
  dayChartData: ChartData<"bar"> = {
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
  monthChartData: ChartData<"bar"> = {
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
  ratingChartData: ChartData<"line"> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: "Average Rating",
        borderColor: "rgba(255,82,82,0.9)",
        fill: false,
      },
    ],
  };

  chartOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: "#666",
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0,0,0,0.1)",
        },
        ticks: {
          color: "#666",
        },
      },
      x: {
        grid: {
          color: "rgba(0,0,0,0.1)",
        },
        ticks: {
          color: "#666",
        },
      },
    },
  };
  objectKeys = Object.keys;
  private themeSubscription?: Subscription;

  constructor(
    private statsService: StatsService,
    private dialog: MatDialog,
    private themeService: ThemeService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadBeerData();
    this.dateRange.valueChanges.subscribe(() => this.onDateChange());
    this.customStartDate.valueChanges.subscribe(() => this.onDateChange());
    this.customEndDate.valueChanges.subscribe(() => this.onDateChange());

    this.themeSubscription = this.themeService.theme$.subscribe((theme) => {
      this.updateChartOptions(theme);
    });
  }

  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }

  private updateChartOptions(theme: "light-theme" | "dark-theme"): void {
    const isDark = theme === "dark-theme";
    const textColor = isDark ? "#e0e0e0" : "#666";
    const gridColor = isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)";

    this.chartOptions = {
      ...this.chartOptions,
      plugins: {
        ...this.chartOptions.plugins,
        legend: {
          ...this.chartOptions.plugins?.legend,
          labels: {
            ...this.chartOptions.plugins?.legend?.labels,
            color: textColor,
          },
        },
      },
      scales: {
        y: {
          ...this.chartOptions.scales?.y,
          grid: {
            color: gridColor,
          },
          ticks: {
            color: textColor,
          },
        },
        x: {
          ...this.chartOptions.scales?.x,
          grid: {
            color: gridColor,
          },
          ticks: {
            color: textColor,
          },
        },
      },
    };
  }

  loadBeerData(): void {
    this.statsService.loadBeerData().subscribe({
      next: (data: BeerCheckin[]) => {
        this.beers = data;
        this.onDateChange();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error fetching beers:", err);
      },
      complete: () => {
        console.log("Beers fetch completed");
      },
    });
  }

  onDateChange(): void {
    if (!this.beers || this.beers.length === 0) {
      this.processedStats = null;
      this.clearChartData();
      return;
    }

    const rangeType = this.dateRange.value;
    let rangeStart: Date;
    let rangeEnd: Date = new Date();

    if (rangeType === "custom") {
      rangeStart = this.customStartDate.value
        ? new Date(this.customStartDate.value)
        : new Date();
      rangeEnd = this.customEndDate.value
        ? new Date(this.customEndDate.value)
        : new Date();
    } else {
      switch (rangeType) {
        case "week":
          rangeStart = DateUtils.subtractDays(7);
          break;
        case "month":
          rangeStart = DateUtils.subtractMonths(1);
          break;
        case "year":
          rangeStart = DateUtils.subtractMonths(12);
          break;
        case "all":
        default:
          rangeStart = new Date("2000-01-01");
          break;
      }
    }

    const stats = this.statsService.computeStats(
      this.beers,
      rangeStart,
      rangeEnd,
    );

    this.processedStats = {
      totalUniqueBeers: stats.totalUniqueBeers ?? 0,
      totalCheckins: stats.totalCheckins ?? 0,
      newBeersCount: stats.newBeersCount ?? 0,
      newBeerRatio: stats.newBeerRatio ?? 0,
      averageRating: stats.averageRating ?? 0,
      totalUniqueBreweries: stats.totalUniqueBreweries ?? 0,
      beerStylesCount: stats.beerStylesCount ?? {},
      topBeers: stats.topBeers ?? [],
      topCountries: stats.topCountries ?? {},
      topStates: stats.topStates ?? {},
      recentActivityByDate: stats.recentActivityByDate ?? [],
      checkinsByHour: stats.checkinsByHour ?? [],
      checkinsByDay: stats.checkinsByDay ?? [],
      checkinsByDayOfWeek: stats.checkinsByDayOfWeek ?? [],
      checkinsByMonth: stats.checkinsByMonth ?? [],
      averageRatingsOverTime: stats.averageRatingsOverTime ?? [],
    };

    // Update charts
    this.updateCharts();
  }

  generateLastNDaysLabels(days: number): string[] {
    const labels: string[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = DateUtils.subtractDays(i);
      labels.push(
        date.toLocaleString("en-US", { month: "short", day: "numeric" }),
      );
    }
    return labels;
  }

  getStartDate(): Date | null {
    const range = this.dateRange.value;
    switch (range) {
      case "week":
        return DateUtils.subtractDays(7);
      case "month":
        return DateUtils.subtractMonths(1);
      case "year":
        return DateUtils.subtractMonths(12);
      case "custom":
        return this.customStartDate.value
          ? new Date(this.customStartDate.value)
          : null;
      case "all":
      default:
        return null;
    }
  }

  getEndDate(): Date | null {
    return this.dateRange.value === "custom" && this.customEndDate.value
      ? new Date(this.customEndDate.value)
      : new Date();
  }

  private clearChartData(): void {
    this.hourChartData.datasets[0].data = [];
    this.recentActivityChartLabels = [];
    this.recentActivityChartData = { labels: [], datasets: [] };
    this.checkinsByDayLabels = [];
    this.dayChartData = { labels: [], datasets: [] };
    this.monthChartData = { labels: [], datasets: [] };
    this.ratingChartData = { labels: [], datasets: [] };
  }

  private updateCharts(): void {
    if (!this.processedStats) return;

    // Re-assign to trigger change detection in ng2-charts
    this.hourChartData = {
      labels: this.hourChartLabels,
      datasets: [
        {
          data: this.processedStats.checkinsByHour,
          label: "Check-ins by Hour",
          backgroundColor: "rgba(63,81,181,0.8)",
        },
      ],
    };

    // Recent activity
    this.recentActivityChartLabels =
      this.processedStats.recentActivityByDate.map(
        (d: { date: any }) => d.date,
      );
    this.recentActivityChartData = {
      labels: this.recentActivityChartLabels,
      datasets: [
        {
          data: this.processedStats.recentActivityByDate.map(
            (d: { count: any }) => d.count,
          ),
          label: "Beers Checked In",
          fill: false,
          borderColor: "rgba(255,235,59,0.9)",
          tension: 0.3,
        },
      ],
    };

    // Check-ins by day of week
    const dayOfWeekLabels = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const dayOfWeekCounts = new Array(7).fill(0);
    this.processedStats.checkinsByDayOfWeek?.forEach(
      (item: { day: string; count: any }) => {
        const index = dayOfWeekLabels.indexOf(item.day);
        if (index !== -1) dayOfWeekCounts[index] = item.count;
      },
    );
    this.dayChartData = {
      labels: dayOfWeekLabels,
      datasets: [
        {
          data: dayOfWeekCounts,
          label: "Check-ins by Day of Week",
          backgroundColor: "rgba(255,167,38,0.8)",
        },
      ],
    };

    // Check-ins by month
    const monthLabels = [
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
    ];
    const monthCounts = new Array(12).fill(0);
    this.processedStats.checkinsByMonth?.forEach(
      (item: { month: string; count: any }) => {
        const index = monthLabels.indexOf(item.month);
        if (index !== -1) monthCounts[index] = item.count;
      },
    );
    this.monthChartData = {
      labels: monthLabels,
      datasets: [
        {
          data: monthCounts,
          label: "Check-ins by Month",
          backgroundColor: "rgba(171,71,188,0.8)",
        },
      ],
    };

    // Average ratings
    this.ratingChartData = {
      labels:
        this.processedStats.averageRatingsOverTime?.map(
          (item: { date: any }) => item.date,
        ) || [],
      datasets: [
        {
          data:
            this.processedStats.averageRatingsOverTime?.map(
              (item: { rating: any }) => item.rating,
            ) || [],
          label: "Average Rating",
          fill: false,
          borderColor: "rgba(255,82,82,0.9)",
          tension: 0.2,
        },
      ],
    };
  }

  // Beer styles list
  beerStylesList(): string[] {
    return Object.keys(this.processedStats?.beerStylesCount || {}).sort(
      (a, b) =>
        this.processedStats!.beerStylesCount[b] -
        this.processedStats!.beerStylesCount[a],
    );
  }

  private openGenericBeersDialog(
    title: string,
    filteredBeers: BeerCheckin[],
  ): void {
    const dialogData: GenericBeersDialogData = {
      title,
      beers: filteredBeers.map((b) => ({
        beerName: b.beer.beer_name,
        beerLabel:
          b.beer.beer_label ||
          "https://assets.untappd.com/site/assets/images/temp/badge-beer-default.png",
        breweryName: b.brewery.brewery_name,
        beerABV: b.beer.beer_abv,
        rating: b.rating_score,
        checkInDate: b.recent_created_at
          ? DateUtils.formatTimestamp(b.recent_created_at)
          : "Unknown Date",
      })),
    };

    this.dialog.open(BeerStyleDialogComponent, {
      data: dialogData,
      width: "350px",
      maxHeight: "80vh",
    });
  }

  // Open by style, top beer, country, state
  openBeersByStyle(style: string) {
    const startDate = this.getStartDate();
    const endDate = this.getEndDate();
    const normalize = (s: string) => s.trim().toLowerCase();

    const filtered = this.beers.filter((b) => {
      const beerStyle = normalize(b.beer.beer_style);
      return (
        beerStyle === normalize(style) &&
        (!startDate ||
          !endDate ||
          (DateUtils.parseDate(b.recent_created_at) >= startDate &&
            DateUtils.parseDate(b.recent_created_at) <= endDate))
      );
    });
    this.openGenericBeersDialog(`Beers with Style: ${style}`, filtered);
  }

  openBeersByTopBeer(beerName: string) {
    const startDate = this.getStartDate();
    const endDate = this.getEndDate();

    const filtered = this.beers.filter((b) => {
      const d = DateUtils.parseDate(b.recent_created_at);
      return (
        b.beer.beer_name === beerName &&
        (!startDate || !endDate || (d >= startDate && d <= endDate))
      );
    });
    this.openGenericBeersDialog(`All Check-ins for: ${beerName}`, filtered);
  }

  openBeersByCountry(country: string) {
    const startDate = this.getStartDate();
    const endDate = this.getEndDate();

    const filtered = this.beers.filter((b) => {
      const d = DateUtils.parseDate(b.recent_created_at);
      return (
        b.brewery.country_name === country &&
        (!startDate || !endDate || (d >= startDate && d <= endDate))
      );
    });
    this.openGenericBeersDialog(`Beers from: ${country}`, filtered);
  }

  openBeersByState(state: string) {
    const startDate = this.getStartDate();
    const endDate = this.getEndDate();

    const filtered = this.beers.filter((b) => {
      const d = DateUtils.parseDate(b.recent_created_at);
      return (
        b.brewery.location.brewery_state === state &&
        (!startDate || !endDate || (d >= startDate && d <= endDate))
      );
    });
    this.openGenericBeersDialog(`Beers from: ${state}`, filtered);
  }
}
