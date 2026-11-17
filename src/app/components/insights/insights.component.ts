import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  inject,
  signal,
  effect,
  DestroyRef,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { ActivatedRoute, Router } from "@angular/router";
import { CommonModule, DecimalPipe } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import {
  BaseChartDirective,
  provideCharts,
  withDefaultRegisterables,
} from "ng2-charts";
import { ChartData, ChartEvent, ChartOptions, ActiveElement } from "chart.js";

import { BeerStoreService } from "src/app/core/services/beer-store.service";
import { LoggingService } from "src/app/core/services/logger.service";
import { ThemeService } from "src/app/core/services/theme.service";
import { BeerCheckin } from "src/app/core/models/beer.model";
import { Checkin } from "src/app/core/models/checkin.model";
import { SkeletonCardComponent } from "../../shared/components/skeleton-card/skeleton-card.component";
import { EmptyStateComponent } from "../../shared/components/empty-state/empty-state.component";
import {
  BeerStyleDialogComponent,
  GenericBeersDialogData,
} from "../../shared/components/beer-style-dialog/beer-style-dialog.component";
import {
  StylesListDialogComponent,
  StyleItem,
} from "../../shared/components/styles-list-dialog/styles-list-dialog.component";
import { sanitizeUntappdUrl } from "../../core/utils/url-utils";
import { CHART_FILTER_PARAMS } from "../../core/utils/view-state";
import { environment } from "src/environments/environment";

export interface Milestone {
  icon: string;
  title: string;
  value: string | number;
  subtitle: string;
}

@Component({
  selector: "app-insights",
  templateUrl: "./insights.component.html",
  styleUrls: ["./insights.component.css"],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    BaseChartDirective,
    SkeletonCardComponent,
    EmptyStateComponent,
  ],
  providers: [DecimalPipe, provideCharts(withDefaultRegisterables())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InsightsComponent implements OnInit {
  private beerStore = inject(BeerStoreService);
  private themeService = inject(ThemeService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);
  private logger = inject(LoggingService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  public beers: BeerCheckin[] = [];
  public hasData = signal<boolean>(false);
  public hasLoadError = signal<boolean>(false);
  private rawCheckins: Checkin[] = [];
  public isLoading = signal<boolean>(true);
  public milestones = signal<Milestone[]>([]);
  public averageABV = signal<number>(0);
  public topCategory = signal<string>("IPA");
  public totalUniqueStyles = signal<number>(0);

  /** A `?style=`/`?rating=` deep link waiting for the beers to finish loading. */
  private deepLinkSelection: { key: string; value: string } | null = null;

  /** The last selection acted on, so a re-emitted query param is a no-op. */
  private lastAppliedSelection: { key: string; value: string } | null = null;

  public checkinHeatmapWeeks = signal<
    {
      date: string;
      formattedDate: string;
      count: number;
      intensity: number;
    }[][]
  >([]);
  public heatmapTotalCheckins = signal<number>(0);
  public activeDaysCount = signal<number>(0);
  public currentStreak = signal<number>(0);
  public longestStreak = signal<number>(0);

  public ratingLabels: string[] = [
    "0.25",
    "0.50",
    "0.75",
    "1.00",
    "1.25",
    "1.50",
    "1.75",
    "2.00",
    "2.25",
    "2.50",
    "2.75",
    "3.00",
    "3.25",
    "3.50",
    "3.75",
    "4.00",
    "4.25",
    "4.50",
    "4.75",
    "5.00",
  ];

  public ratingHistogramChartData: ChartData<"bar", number[], string> = {
    labels: this.ratingLabels,
    datasets: [
      {
        data: Array(20).fill(0),
        label: "Rating Frequency",
        backgroundColor: "rgba(245, 158, 11, 0.75)",
        borderColor: "#f59e0b",
        borderWidth: 1,
        borderRadius: 4,
      },
    ],
  };

  public ratingChartOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    events: ["mousemove", "mouseout", "click", "touchstart", "touchmove"],
    onHover: (event: ChartEvent, elements: ActiveElement[]) =>
      this.setPointerCursor(event, elements),
    onClick: (event: ChartEvent, elements: ActiveElement[]) =>
      this.onRatingChartClick(elements),
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#0f172a",
          font: { size: 10, weight: "bold" },
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          color: "#475569",
          stepSize: 1,
        },
      },
    },
  };

  public styleBarChartData: ChartData<"bar", number[], string> = {
    labels: [],
    datasets: [
      {
        data: [],
        label: "Check-ins",
        backgroundColor: "rgba(56, 189, 248, 0.75)",
        borderColor: "#38bdf8",
        borderWidth: 1,
        borderRadius: 4,
        maxBarThickness: 28,
      },
    ],
  };

  /**
   * Height of the bar chart canvas, grown to fit one row per style so the
   * y-axis labels never overlap the bars or each other.
   */
  public styleBarChartHeight = signal<number>(320);

  public styleBarChartOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y",
    events: ["mousemove", "mouseout", "click", "touchstart", "touchmove"],
    interaction: {
      mode: "nearest",
      intersect: false,
    },
    onHover: (event: ChartEvent, elements: ActiveElement[]) =>
      this.setPointerCursor(event, elements),
    onClick: (event: ChartEvent, elements: ActiveElement[]) =>
      this.onStyleBarClick(elements),
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        enabled: true,
        mode: "nearest",
        intersect: false,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: {
          color: "rgba(0, 0, 0, 0.1)",
        },
        ticks: {
          color: "#475569",
          precision: 0,
        },
      },
      y: {
        grid: {
          display: false,
        },
        ticks: {
          color: "#0f172a",
          font: { size: 12, weight: "bold" },
          autoSkip: false,
          callback: (_tickValue: string | number, index: number) => {
            const label = this.styleBarChartData.labels?.[index];
            return typeof label === "string"
              ? this.wrapStyleLabel(label)
              : (label ?? "");
          },
        },
      },
    },
  };

  constructor() {
    effect(() => {
      const currentTheme = this.themeService.currentTheme();
      this.updateChartThemeOptions(currentTheme);
    });
  }

  ngOnInit(): void {
    this.beerStore.load();
    this.beerStore.beers$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (beers: BeerCheckin[] | null) => {
        if (beers && beers.length > 0) {
          this.beers = beers;
          this.computeInsights(beers);
          this.hasData.set(true);
          this.isLoading.set(false);
          // A deep link may have arrived before the beers finished loading.
          this.openDeepLinkSelection();
          this.cdr.markForCheck();
        } else if (beers !== null) {
          // Loaded but empty (e.g. a failed fetch): stop the skeleton so the
          // empty state can render instead of spinning forever.
          this.isLoading.set(false);
          this.cdr.markForCheck();
        }
      },
      error: (err: unknown) => {
        this.logger.error("Error loading insights beers", err);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
    });

    this.beerStore.checkins$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (checkins: Checkin[] | null) => {
          if (checkins && checkins.length > 0) {
            this.rawCheckins = checkins;
            this.computeHeatmap(checkins);
            this.cdr.markForCheck();
          }
        },
        error: (err: unknown) => {
          this.logger.error("Error loading insights checkins", err);
        },
      });

    this.beerStore.loadError$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((hasError) => {
        this.hasLoadError.set(hasError);
        this.cdr.markForCheck();
      });

    // Deep link: a shared URL carrying `?style=`/`?rating=` reopens the
    // matching filtered list. `queryParams` replays the current value on
    // subscribe, so a bookmarked load and an in-page navigation both work.
    this.route.queryParams
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => this.applySelectionFromParams(params));
  }

  /** Retries loading all store data after a failed load. */
  retryLoad(): void {
    this.beerStore.load(true);
  }

  private updateChartThemeOptions(theme: "light-theme" | "dark-theme"): void {
    const isLight = theme === "light-theme";
    const textColor = isLight ? "#0f172a" : "#f1f5f9";
    const tickColor = isLight ? "#475569" : "#94a3b8";
    const brandAccent = isLight ? "#0284c7" : "#38bdf8";
    const brandBarBg = isLight
      ? "rgba(2, 132, 199, 0.75)"
      : "rgba(56, 189, 248, 0.75)";

    this.styleBarChartOptions = {
      ...this.styleBarChartOptions,
      scales: {
        x: {
          beginAtZero: true,
          grid: {
            color: isLight ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)",
          },
          ticks: {
            color: tickColor,
            precision: 0,
          },
        },
        y: {
          grid: {
            display: false,
          },
          ticks: {
            ...this.styleBarChartOptions.scales?.["y"]?.ticks,
            color: textColor,
            font: { size: 12, weight: "bold" },
            autoSkip: false,
          },
        },
      },
    };

    if (this.styleBarChartData.datasets[0]) {
      this.styleBarChartData = {
        ...this.styleBarChartData,
        datasets: [
          {
            ...this.styleBarChartData.datasets[0],
            backgroundColor: brandBarBg,
            borderColor: brandAccent,
          },
        ],
      };
    }

    const amberBg = isLight
      ? "rgba(245, 158, 11, 0.8)"
      : "rgba(251, 191, 36, 0.8)";
    const amberBorder = isLight ? "#d97706" : "#fbbf24";

    this.ratingChartOptions = {
      ...this.ratingChartOptions,
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: textColor,
            font: { size: 10, weight: "bold" },
          },
        },
        y: {
          beginAtZero: true,
          grid: {
            color: isLight ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)",
          },
          ticks: {
            color: tickColor,
            stepSize: 1,
          },
        },
      },
    };

    if (this.ratingHistogramChartData.datasets[0]) {
      this.ratingHistogramChartData = {
        ...this.ratingHistogramChartData,
        datasets: [
          {
            ...this.ratingHistogramChartData.datasets[0],
            backgroundColor: amberBg,
            borderColor: amberBorder,
          },
        ],
      };
    }

    this.cdr.markForCheck();
  }

  /**
   * Grows the canvas so each style gets a comfortable row. Chart.js renders
   * multi-line labels, but a fixed height would cram the axis ticks together
   * once there are many styles, so the height tracks the row count instead.
   */
  private computeStyleBarChartHeight(labels: string[]): number {
    const ROW_HEIGHT = 44;
    const MIN_HEIGHT = 220;
    const MAX_HEIGHT = 640;
    const rows = Math.max(labels.length, 1);
    return Math.min(Math.max(rows * ROW_HEIGHT + 40, MIN_HEIGHT), MAX_HEIGHT);
  }

  /**
   * Breaks a long style name onto multiple lines so it stays fully readable
   * without pushing the bars off the chart. The label is hard-wrapped at word
   * boundaries to fit within a fixed pixel width.
   */
  private wrapStyleLabel(label: string, maxChars = 24): string {
    if (label.length <= maxChars) return label;

    const words = label.split(/\s+/);
    const lines: string[] = [];
    let current = "";

    for (const word of words) {
      // A single word longer than the line still needs breaking, otherwise it
      // would overflow the axis and get clipped.
      const chunks =
        word.length > maxChars
          ? (word.match(new RegExp(`.{1,${maxChars}}`, "g")) ?? [word])
          : [word];

      for (const chunk of chunks) {
        if (!current) {
          current = chunk;
        } else if (`${current} ${chunk}`.length <= maxChars) {
          current = `${current} ${chunk}`;
        } else {
          lines.push(current);
          current = chunk;
        }
      }
    }
    if (current) lines.push(current);

    return lines.join("\n");
  }

  // ---------------- CHART INTERACTION ----------------

  /**
   * Shows a pointer cursor over clickable chart elements (bars, slices) and
   * resets it otherwise, so the chart reads as interactive on desktop. On
   * touch devices the `click`/`touchstart` events below still fire.
   */
  private setPointerCursor(event: ChartEvent, elements: ActiveElement[]): void {
    const target = event.native?.target as HTMLElement | null | undefined;
    if (!target || !target.style) return;
    target.style.cursor = elements.length > 0 ? "pointer" : "default";
  }

  /** Resolves the category label behind a clicked bar in the style chart. */
  private onStyleBarClick(elements: ActiveElement[]): void {
    const index = elements[0]?.index;
    if (index === undefined) return;

    const label = this.styleBarChartData.labels?.[index];
    if (typeof label !== "string") return;

    this.selectStyle(label);
  }

  /** Resolves the rating bin behind a clicked bar in the histogram. */
  private onRatingChartClick(elements: ActiveElement[]): void {
    const index = elements[0]?.index;
    if (index === undefined) return;

    const label = this.ratingHistogramChartData.labels?.[index];
    if (typeof label !== "string") return;

    this.selectRating(label);
  }

  /**
   * Opens the style's check-in list and mirrors the selection into the URL
   * (`?style=`), merging with any existing params so other state survives.
   */
  public selectStyle(style: string): void {
    this.lastAppliedSelection = {
      key: CHART_FILTER_PARAMS.style,
      value: style,
    };
    this.openCategoryDialog(style);
    this.updateQueryParam(CHART_FILTER_PARAMS.style, style);
  }

  /** Opens the rating bin's check-in list and mirrors it into the URL. */
  public selectRating(rating: string): void {
    this.lastAppliedSelection = {
      key: CHART_FILTER_PARAMS.rating,
      value: rating,
    };
    this.openRatingDialog(rating);
    this.updateQueryParam(CHART_FILTER_PARAMS.rating, rating);
  }

  /** Writes a single chart selection into the URL, merging existing params. */
  private updateQueryParam(key: string, value: string | null): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { [key]: value },
      queryParamsHandling: "merge",
      replaceUrl: true,
    });
  }

  /**
   * Restores a chart selection from a shared or bookmarked URL by reopening
   * the matching dialog.
   *
   * A selection this component just wrote (a chart click) is not reopened: the
   * query-param emission it produces is recognised and skipped, so a click
   * never opens the dialog twice.
   */
  private applySelectionFromParams(params: Record<string, string>): void {
    const style = params[CHART_FILTER_PARAMS.style];
    const rating = params[CHART_FILTER_PARAMS.rating];
    const selection = style
      ? { key: CHART_FILTER_PARAMS.style, value: style }
      : rating
        ? { key: CHART_FILTER_PARAMS.rating, value: rating }
        : null;

    if (!selection) {
      this.lastAppliedSelection = null;
      return;
    }

    if (
      this.lastAppliedSelection?.key === selection.key &&
      this.lastAppliedSelection.value === selection.value
    ) {
      return;
    }

    this.lastAppliedSelection = selection;
    this.deepLinkSelection = selection;
    this.openDeepLinkSelection();
  }

  /**
   * Opens the list for a deep-linked selection, deferring until the beers are
   * loaded so the dialog is never built from an empty set.
   */
  private openDeepLinkSelection(): void {
    const selection = this.deepLinkSelection;
    if (!selection || this.beers.length === 0) return;

    this.deepLinkSelection = null;
    if (selection.key === CHART_FILTER_PARAMS.style) {
      this.openCategoryDialog(selection.value);
    } else {
      this.openRatingDialog(selection.value);
    }
  }

  /** Opens the check-in list for a rating bin (e.g. `4.25`). */
  public openRatingDialog(ratingLabel: string): void {
    const target = Number(ratingLabel);
    const filtered = this.beers.filter((b) => {
      if (!b.rating_score || b.rating_score <= 0) return false;
      return Math.round(b.rating_score * 4) / 4 === target;
    });
    this.openBeersDialog(`${ratingLabel}★ Drinks`, filtered);
  }

  public matchesCategory(b: BeerCheckin, categoryName: string): boolean {
    const styleLower = (b.beer.beer_style || "").toLowerCase();
    switch (categoryName) {
      case "IPA":
        return styleLower.includes("ipa") || styleLower.includes("india pale");
      case "Stout / Porter":
        return styleLower.includes("stout") || styleLower.includes("porter");
      case "Sour / Wild":
        return (
          styleLower.includes("sour") ||
          styleLower.includes("wild") ||
          styleLower.includes("gose") ||
          styleLower.includes("berliner weisse") ||
          styleLower.includes("lambic") ||
          styleLower.includes("coolship")
        );
      case "Lager / Pilsner":
        return (
          styleLower.includes("lager") ||
          styleLower.includes("pilsner") ||
          styleLower.includes("pils") ||
          styleLower.includes("helles") ||
          styleLower.includes("bock") ||
          styleLower.includes("märzen") ||
          styleLower.includes("marzen") ||
          styleLower.includes("kellerbier") ||
          styleLower.includes("dunkel") ||
          styleLower.includes("schwarzbier") ||
          styleLower.includes("vienna") ||
          styleLower.includes("zoigl")
        );
      case "Pale Ale":
        return styleLower.includes("pale ale");
      case "Wheat":
        return (
          styleLower.includes("wheat") ||
          styleLower.includes("hefeweizen") ||
          styleLower.includes("witbier") ||
          styleLower.includes("dunkelweizen") ||
          styleLower.includes("weizenbock") ||
          styleLower.includes("grisette")
        );
      case "Belgian / Farmhouse":
        return (
          styleLower.includes("belgian") ||
          styleLower.includes("abbey") ||
          styleLower.includes("trappist") ||
          styleLower.includes("dubbel") ||
          styleLower.includes("tripel") ||
          styleLower.includes("quadrupel") ||
          styleLower.includes("saison") ||
          styleLower.includes("bière de garde") ||
          styleLower.includes("blonde ale") ||
          styleLower.includes("enkel") ||
          styleLower.includes("patersbier")
        );
      case "Strong Ale":
        return (
          styleLower.includes("barleywine") ||
          styleLower.includes("old ale") ||
          styleLower.includes("wee heavy") ||
          styleLower.includes("scotch ale") ||
          styleLower.includes("strong ale") ||
          styleLower.includes("doppelsticke") ||
          styleLower.includes("sticke")
        );
      case "Cider / Perry / Mead":
        return (
          styleLower.includes("cider") ||
          styleLower.includes("perry") ||
          styleLower.includes("graff") ||
          styleLower.includes("mead") ||
          styleLower.includes("cyser") ||
          styleLower.includes("melomel")
        );
      case "Wine":
        return (
          styleLower.includes("wine") ||
          styleLower.includes("champagne") ||
          styleLower.includes("prosecco") ||
          styleLower.includes("vermouth") ||
          styleLower.includes("port") ||
          styleLower.includes("sherry") ||
          styleLower.includes("sangria") ||
          styleLower.includes("spritz")
        );
      case "Spirit / RTD":
        return (
          styleLower.includes("spirit") ||
          styleLower.includes("whiskey") ||
          styleLower.includes("whisky") ||
          styleLower.includes("bourbon") ||
          styleLower.includes("scotch") ||
          styleLower.includes("gin") ||
          styleLower.includes("vodka") ||
          styleLower.includes("tequila") ||
          styleLower.includes("mezcal") ||
          styleLower.includes("rum") ||
          styleLower.includes("brandy") ||
          styleLower.includes("cognac") ||
          styleLower.includes("liqueur") ||
          styleLower.includes("absinthe") ||
          styleLower.includes("rtd") ||
          styleLower.includes("cocktail")
        );
      case "Sake":
        return (
          styleLower.includes("sake") ||
          styleLower.includes("junmai") ||
          styleLower.includes("daiginjo") ||
          styleLower.includes("honjozo")
        );
      case "Non-Alcoholic / Soda / Root Beer":
        return (
          styleLower.includes("non-alcoholic") ||
          styleLower.includes("root beer") ||
          styleLower.includes("soda") ||
          styleLower.includes("cola") ||
          styleLower.includes("ginger ale") ||
          styleLower.includes("kombucha") ||
          styleLower.includes("coffee") ||
          styleLower.includes("tea") ||
          styleLower.includes("malta") ||
          styleLower.includes("fassbrause")
        );
      case "THC / Cannabinoid":
        return (
          styleLower.includes("thc") ||
          styleLower.includes("cannabinoid") ||
          styleLower.includes("cbd") ||
          styleLower.includes("hemp")
        );
      case "Fruit / Field / Spice":
        return (
          styleLower.includes("fruit") ||
          styleLower.includes("shandy") ||
          styleLower.includes("radler") ||
          styleLower.includes("pumpkin") ||
          styleLower.includes("spiced") ||
          styleLower.includes("herb") ||
          styleLower.includes("vegetable")
        );
      default:
        return true;
    }
  }

  private openBeersDialog(
    title: string,
    filtered: BeerCheckin[],
    showBackButton = false,
  ) {
    const data: GenericBeersDialogData = {
      title,
      beers: filtered.map((b) => ({
        beerName: b.beer.beer_name,
        beerLabel: sanitizeUntappdUrl(b.beer.beer_label) || b.beer.beer_label,
        breweryName: b.brewery.brewery_name,
        beerABV: b.beer.beer_abv,
        rating: b.rating_score,
        checkInDate: b.first_created_at || b.recent_created_at,
        checkinUrl:
          environment.UNTAPPD_USERNAME && b.recent_checkin_id
            ? `https://untappd.com/user/${environment.UNTAPPD_USERNAME}/checkin/${b.recent_checkin_id}`
            : undefined,
      })),
      showBackButton,
    };

    return this.dialog.open(BeerStyleDialogComponent, {
      data,
      autoFocus: false,
      width: "350px",
      maxHeight: "80vh",
    });
  }

  public openAbvDialog(): void {
    const filtered = [...this.beers]
      .filter((b) => b.beer.beer_abv > 0)
      .sort((a, b) => b.beer.beer_abv - a.beer.beer_abv)
      .slice(0, 15);
    this.openBeersDialog("Top Highest ABV Drinks", filtered);
  }

  public openStylesDialog(): void {
    const styleCounts: Record<string, number> = {};
    this.beers.forEach((b) => {
      const style = b.beer.beer_style || "Unknown";
      styleCounts[style] = (styleCounts[style] || 0) + 1;
    });

    const styles: StyleItem[] = Object.entries(styleCounts)
      .map(([styleName, count]) => ({ styleName, count }))
      .sort(
        (a, b) => b.count - a.count || a.styleName.localeCompare(b.styleName),
      );

    const dialogRef = this.dialog.open(StylesListDialogComponent, {
      data: {
        title: "Unique Styles Explorer",
        styles,
      },
      autoFocus: false,
      width: "380px",
      maxHeight: "80vh",
    });

    dialogRef.afterClosed().subscribe((selectedStyle: string | undefined) => {
      if (selectedStyle) {
        const filtered = this.beers.filter(
          (b) => (b.beer.beer_style || "Unknown") === selectedStyle,
        );
        const beersDialogRef = this.openBeersDialog(
          `${selectedStyle} Drinks`,
          filtered,
          true,
        );
        beersDialogRef.afterClosed().subscribe((result) => {
          if (result === "back") {
            this.openStylesDialog();
          }
        });
      }
    });
  }

  public openCategoryDialog(category: string): void {
    const filtered = this.beers.filter((b) =>
      this.matchesCategory(b, category),
    );
    this.openBeersDialog(`${category} Drinks`, filtered);
  }

  public openBreweryDialog(breweryName: string): void {
    const filtered = this.beers.filter(
      (b) => b.brewery.brewery_name === breweryName,
    );
    this.openBeersDialog(`${breweryName} Drinks`, filtered);
  }

  public heatmapDayLabel(day: {
    count: number;
    formattedDate: string;
  }): string {
    const noun = day.count === 1 ? "check-in" : "check-ins";
    return day.count > 0
      ? `${day.count} ${noun} on ${day.formattedDate}`
      : `No check-ins on ${day.formattedDate}`;
  }

  public onDayKeydown(
    event: Event,
    day: { date: string; formattedDate: string; count: number },
  ): void {
    event.preventDefault();
    this.openDayCheckinsDialog(day);
  }

  public openDayCheckinsDialog(day: {
    date: string;
    formattedDate: string;
    count: number;
  }): void {
    if (day.count === 0) return;

    const matchingCheckins = this.rawCheckins.filter((c) => {
      if (!c.created_at) return false;
      const date = new Date(c.created_at);
      if (isNaN(date.getTime())) return false;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      return key === day.date;
    });

    const data: GenericBeersDialogData = {
      title: `Check-ins on ${day.formattedDate}`,
      beers: matchingCheckins.map((c) => ({
        beerName: c.beer.beer_name,
        beerLabel: sanitizeUntappdUrl(c.beer.beer_label) || c.beer.beer_label,
        breweryName: c.brewery.brewery_name,
        beerABV: 0,
        rating: c.rating_score,
        checkInDate: c.created_at,
        checkinUrl:
          environment.UNTAPPD_USERNAME && c.checkin_id
            ? `https://untappd.com/user/${environment.UNTAPPD_USERNAME}/checkin/${c.checkin_id}`
            : undefined,
      })),
    };

    this.dialog.open(BeerStyleDialogComponent, {
      data,
      autoFocus: false,
      width: "350px",
      maxHeight: "80vh",
    });
  }

  public openPeakMonthDialog(monthYear: string): void {
    const filtered = this.beers.filter((b) => {
      if (!b.recent_created_at) return false;
      const date = new Date(b.recent_created_at);
      if (isNaN(date.getTime())) return false;
      const my = date.toLocaleString("default", {
        month: "short",
        year: "numeric",
      });
      return my === monthYear;
    });
    this.openBeersDialog(`Check-ins in ${monthYear}`, filtered);
  }

  public computeHeatmap(checkins: Checkin[]): void {
    const dailyCounts: Record<string, number> = {};
    checkins.forEach((c) => {
      if (!c.created_at) return;
      const date = new Date(c.created_at);
      if (isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      dailyCounts[key] = (dailyCounts[key] || 0) + 1;
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 364);
    while (startDate.getDay() !== 0) {
      startDate.setDate(startDate.getDate() - 1);
    }

    const weeks: {
      date: string;
      formattedDate: string;
      count: number;
      intensity: number;
    }[][] = [];
    let currentWeek: {
      date: string;
      formattedDate: string;
      count: number;
      intensity: number;
    }[] = [];
    let totalCount = 0;
    let activeDays = 0;

    const curr = new Date(startDate);
    while (curr <= today) {
      const key = `${curr.getFullYear()}-${String(curr.getMonth() + 1).padStart(2, "0")}-${String(curr.getDate()).padStart(2, "0")}`;
      const count = dailyCounts[key] || 0;
      totalCount += count;
      if (count > 0) activeDays++;

      let intensity = 0;
      if (count === 1) intensity = 1;
      else if (count === 2) intensity = 2;
      else if (count >= 3 && count <= 4) intensity = 3;
      else if (count >= 5) intensity = 4;

      const formattedDate = curr.toLocaleDateString("default", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });

      currentWeek.push({
        date: key,
        formattedDate,
        count,
        intensity,
      });

      if (currentWeek.length === 7) {
        weeks.push(currentWeek);
        currentWeek = [];
      }

      curr.setDate(curr.getDate() + 1);
    }

    if (currentWeek.length > 0) {
      weeks.push(currentWeek);
    }

    // Calculate streaks
    let currentStreakVal = 0;
    let longestStreakVal = 0;

    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, "0")}-${String(yesterday.getDate()).padStart(2, "0")}`;

    let streakCheckDate = new Date(today);
    if (!dailyCounts[todayKey] && dailyCounts[yesterdayKey]) {
      streakCheckDate = yesterday;
    }

    while (true) {
      const key = `${streakCheckDate.getFullYear()}-${String(streakCheckDate.getMonth() + 1).padStart(2, "0")}-${String(streakCheckDate.getDate()).padStart(2, "0")}`;
      if (dailyCounts[key] && dailyCounts[key] > 0) {
        currentStreakVal++;
        streakCheckDate.setDate(streakCheckDate.getDate() - 1);
      } else {
        break;
      }
    }

    const scanCurr = new Date(startDate);
    let runningStreak = 0;
    while (scanCurr <= today) {
      const key = `${scanCurr.getFullYear()}-${String(scanCurr.getMonth() + 1).padStart(2, "0")}-${String(scanCurr.getDate()).padStart(2, "0")}`;
      if (dailyCounts[key] && dailyCounts[key] > 0) {
        runningStreak++;
        if (runningStreak > longestStreakVal) {
          longestStreakVal = runningStreak;
        }
      } else {
        runningStreak = 0;
      }
      scanCurr.setDate(scanCurr.getDate() + 1);
    }

    this.checkinHeatmapWeeks.set(weeks);
    this.heatmapTotalCheckins.set(totalCount);
    this.activeDaysCount.set(activeDays);
    this.currentStreak.set(currentStreakVal);
    this.longestStreak.set(longestStreakVal);
  }

  public openMilestoneDialog(m: Milestone): void {
    if (m.title === "Top Preferred Category") {
      this.openCategoryDialog(String(m.value));
    } else if (m.title === "Style Diversity") {
      this.openStylesDialog();
    } else if (m.title === "Favorite Brewery") {
      this.openBreweryDialog(String(m.value));
    } else if (m.title === "Peak Activity Month") {
      this.openPeakMonthDialog(String(m.value));
    }
  }

  private computeInsights(beers: BeerCheckin[]): void {
    const categoryCounts: Record<string, number> = {
      IPA: 0,
      "Stout / Porter": 0,
      "Sour / Wild": 0,
      "Lager / Pilsner": 0,
      "Pale Ale": 0,
      Wheat: 0,
      "Belgian / Farmhouse": 0,
      "Strong Ale": 0,
      "Cider / Perry / Mead": 0,
      "Fruit / Field / Spice": 0,
      Wine: 0,
      "Spirit / RTD": 0,
      Sake: 0,
      "Non-Alcoholic / Soda / Root Beer": 0,
      "THC / Cannabinoid": 0,
      "Other / Specialty": 0,
    };
    const bump = (category: string): void => {
      categoryCounts[category] = (categoryCounts[category] ?? 0) + 1;
    };

    const uniqueStyles = new Set<string>();
    let totalABV = 0;
    let abvCount = 0;

    const breweryCounts: Record<string, number> = {};
    const monthCounts: Record<string, number> = {};
    const ratingBins = Array(20).fill(0);

    beers.forEach((b) => {
      if (b.rating_score && b.rating_score > 0) {
        const rounded = Math.round(b.rating_score * 4) / 4;
        const binIndex = Math.round(rounded * 4) - 1;
        if (binIndex >= 0 && binIndex < 20) {
          ratingBins[binIndex] += b.count || 1;
        }
      }
      const style = b.beer.beer_style || "";
      uniqueStyles.add(style);

      if (b.beer.beer_abv) {
        totalABV += b.beer.beer_abv;
        abvCount++;
      }

      const styleLower = style.toLowerCase();

      if (styleLower.includes("ipa") || styleLower.includes("india pale")) {
        bump("IPA");
      } else if (
        styleLower.includes("stout") ||
        styleLower.includes("porter")
      ) {
        bump("Stout / Porter");
      } else if (
        styleLower.includes("sour") ||
        styleLower.includes("wild") ||
        styleLower.includes("gose") ||
        styleLower.includes("berliner weisse") ||
        styleLower.includes("lambic") ||
        styleLower.includes("coolship")
      ) {
        bump("Sour / Wild");
      } else if (
        styleLower.includes("lager") ||
        styleLower.includes("pilsner") ||
        styleLower.includes("pils") ||
        styleLower.includes("helles") ||
        styleLower.includes("bock") ||
        styleLower.includes("märzen") ||
        styleLower.includes("marzen") ||
        styleLower.includes("kellerbier") ||
        styleLower.includes("dunkel") ||
        styleLower.includes("schwarzbier") ||
        styleLower.includes("vienna") ||
        styleLower.includes("zoigl")
      ) {
        bump("Lager / Pilsner");
      } else if (styleLower.includes("pale ale")) {
        bump("Pale Ale");
      } else if (
        styleLower.includes("wheat") ||
        styleLower.includes("hefeweizen") ||
        styleLower.includes("witbier") ||
        styleLower.includes("dunkelweizen") ||
        styleLower.includes("weizenbock") ||
        styleLower.includes("grisette")
      ) {
        bump("Wheat");
      } else if (
        styleLower.includes("belgian") ||
        styleLower.includes("abbey") ||
        styleLower.includes("trappist") ||
        styleLower.includes("dubbel") ||
        styleLower.includes("tripel") ||
        styleLower.includes("quadrupel") ||
        styleLower.includes("saison") ||
        styleLower.includes("bière de garde") ||
        styleLower.includes("blonde ale") ||
        styleLower.includes("enkel") ||
        styleLower.includes("patersbier")
      ) {
        bump("Belgian / Farmhouse");
      } else if (
        styleLower.includes("barleywine") ||
        styleLower.includes("old ale") ||
        styleLower.includes("wee heavy") ||
        styleLower.includes("scotch ale") ||
        styleLower.includes("strong ale") ||
        styleLower.includes("doppelsticke") ||
        styleLower.includes("sticke")
      ) {
        bump("Strong Ale");
      } else if (
        styleLower.includes("cider") ||
        styleLower.includes("perry") ||
        styleLower.includes("graff") ||
        styleLower.includes("mead") ||
        styleLower.includes("cyser") ||
        styleLower.includes("melomel")
      ) {
        bump("Cider / Perry / Mead");
      } else if (
        styleLower.includes("wine") ||
        styleLower.includes("champagne") ||
        styleLower.includes("prosecco") ||
        styleLower.includes("vermouth") ||
        styleLower.includes("port") ||
        styleLower.includes("sherry") ||
        styleLower.includes("sangria") ||
        styleLower.includes("spritz")
      ) {
        bump("Wine");
      } else if (
        styleLower.includes("spirit") ||
        styleLower.includes("whiskey") ||
        styleLower.includes("whisky") ||
        styleLower.includes("bourbon") ||
        styleLower.includes("scotch") ||
        styleLower.includes("gin") ||
        styleLower.includes("vodka") ||
        styleLower.includes("tequila") ||
        styleLower.includes("mezcal") ||
        styleLower.includes("rum") ||
        styleLower.includes("brandy") ||
        styleLower.includes("cognac") ||
        styleLower.includes("liqueur") ||
        styleLower.includes("absinthe") ||
        styleLower.includes("rtd") ||
        styleLower.includes("cocktail")
      ) {
        bump("Spirit / RTD");
      } else if (
        styleLower.includes("sake") ||
        styleLower.includes("junmai") ||
        styleLower.includes("daiginjo") ||
        styleLower.includes("honjozo")
      ) {
        bump("Sake");
      } else if (
        styleLower.includes("non-alcoholic") ||
        styleLower.includes("root beer") ||
        styleLower.includes("soda") ||
        styleLower.includes("cola") ||
        styleLower.includes("ginger ale") ||
        styleLower.includes("kombucha") ||
        styleLower.includes("coffee") ||
        styleLower.includes("tea") ||
        styleLower.includes("malta") ||
        styleLower.includes("fassbrause")
      ) {
        bump("Non-Alcoholic / Soda / Root Beer");
      } else if (
        styleLower.includes("thc") ||
        styleLower.includes("cannabinoid") ||
        styleLower.includes("cbd") ||
        styleLower.includes("hemp")
      ) {
        bump("THC / Cannabinoid");
      } else if (
        styleLower.includes("fruit") ||
        styleLower.includes("shandy") ||
        styleLower.includes("radler") ||
        styleLower.includes("pumpkin") ||
        styleLower.includes("spiced") ||
        styleLower.includes("herb") ||
        styleLower.includes("vegetable")
      ) {
        bump("Fruit / Field / Spice");
      } else {
        bump("Other / Specialty");
      }

      const brewery = b.brewery.brewery_name;
      breweryCounts[brewery] = (breweryCounts[brewery] || 0) + 1;

      if (b.recent_created_at) {
        const date = new Date(b.recent_created_at);
        if (!isNaN(date.getTime())) {
          const monthYear = date.toLocaleString("default", {
            month: "short",
            year: "numeric",
          });
          monthCounts[monthYear] = (monthCounts[monthYear] || 0) + 1;
        }
      }
    });

    this.totalUniqueStyles.set(uniqueStyles.size);
    this.averageABV.set(abvCount > 0 ? totalABV / abvCount : 0);

    const isLight = this.themeService.currentTheme() === "light-theme";
    const brandAccent = isLight ? "#0284c7" : "#38bdf8";
    const brandBarBg = isLight
      ? "rgba(2, 132, 199, 0.75)"
      : "rgba(56, 189, 248, 0.75)";

    // Filter out categories with 0 check-ins so non-legacy categories without check-ins are excluded
    const activeCategories = Object.entries(categoryCounts).filter(
      ([, count]) => count > 0,
    );

    // Update Rating Score Histogram chart data
    const isLightTheme = this.themeService.currentTheme() === "light-theme";
    const amberBg = isLightTheme
      ? "rgba(245, 158, 11, 0.8)"
      : "rgba(251, 191, 36, 0.8)";
    const amberBorder = isLightTheme ? "#d97706" : "#fbbf24";

    this.ratingHistogramChartData = {
      labels: this.ratingLabels,
      datasets: [
        {
          data: ratingBins,
          label: "Rating Frequency",
          backgroundColor: amberBg,
          borderColor: amberBorder,
          borderWidth: 1,
          borderRadius: 4,
        },
      ],
    };

    // Ranked bar chart: sorted descending by check-in count so the most
    // frequently enjoyed styles sit at the top. Ties fall back to the style
    // name for a stable order.
    const rankedCategories = [...activeCategories].sort(
      (a, b) => b[1] - a[1] || a[0].localeCompare(b[0]),
    );

    this.styleBarChartData = {
      labels: rankedCategories.map(([cat]) => cat),
      datasets: [
        {
          data: rankedCategories.map(([, count]) => count),
          label: "Check-ins",
          backgroundColor: brandBarBg,
          borderColor: brandAccent,
          borderWidth: 1,
          borderRadius: 4,
          maxBarThickness: 28,
        },
      ],
    };
    this.styleBarChartHeight.set(
      this.computeStyleBarChartHeight(this.styleBarChartData.labels ?? []),
    );

    // Find top category
    const topCat = rankedCategories[0];
    if (topCat) this.topCategory.set(topCat[0]);

    // Top brewery
    const topBrewery = Object.entries(breweryCounts).sort(
      (a, b) => b[1] - a[1],
    )[0];

    // Most active month
    const topMonth = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0];

    this.milestones.set([
      {
        icon: "emoji_events",
        title: "Top Preferred Category",
        value: topCat ? topCat[0] : "N/A",
        subtitle: `${topCat ? topCat[1] : 0} check-ins`,
      },
      {
        icon: "sports_bar",
        title: "Style Diversity",
        value: `${uniqueStyles.size} Styles`,
        subtitle: "Unique sub-styles tried",
      },
      {
        icon: "business",
        title: "Favorite Brewery",
        value: topBrewery ? topBrewery[0] : "N/A",
        subtitle: `${topBrewery ? topBrewery[1] : 0} check-ins logged`,
      },
      {
        icon: "calendar_month",
        title: "Peak Activity Month",
        value: topMonth ? topMonth[0] : "N/A",
        subtitle: `${topMonth ? topMonth[1] : 0} check-ins in a month`,
      },
    ]);
  }
}
