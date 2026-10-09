import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  inject,
  signal,
  effect,
} from "@angular/core";
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
import { ChartData, ChartOptions } from "chart.js";

import { BeerStoreService } from "src/app/core/services/beer-store.service";
import { ThemeService } from "src/app/core/services/theme.service";
import { BeerCheckin } from "src/app/core/models/beer.model";
import { SkeletonCardComponent } from "../../shared/components/skeleton-card/skeleton-card.component";
import {
  BeerStyleDialogComponent,
  GenericBeersDialogData,
} from "../../shared/components/beer-style-dialog/beer-style-dialog.component";
import {
  StylesListDialogComponent,
  StyleItem,
} from "../../shared/components/styles-list-dialog/styles-list-dialog.component";
import { sanitizeUntappdUrl } from "../../core/utils/url-utils";
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
  ],
  providers: [DecimalPipe, provideCharts(withDefaultRegisterables())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InsightsComponent implements OnInit {
  private beerStore = inject(BeerStoreService);
  private themeService = inject(ThemeService);
  private dialog = inject(MatDialog);
  private cdr = inject(ChangeDetectorRef);

  public beers: BeerCheckin[] = [];
  public isLoading = signal<boolean>(true);
  public milestones = signal<Milestone[]>([]);
  public averageABV = signal<number>(0);
  public topCategory = signal<string>("IPA");
  public totalUniqueStyles = signal<number>(0);

  public styleRadarChartData: ChartData<"radar", number[], string> = {
    labels: [
      "IPA",
      "Stout / Porter",
      "Sour / Wild",
      "Lager / Pilsner",
      "Pale Ale",
      "Wheat",
      "Belgian / Strong",
    ],
    datasets: [
      {
        data: [0, 0, 0, 0, 0, 0, 0],
        label: "Style Experience Count",
        backgroundColor: "rgba(56, 189, 248, 0.25)",
        borderColor: "#38bdf8",
        pointBackgroundColor: "#38bdf8",
      },
    ],
  };

  public radarChartOptions: ChartOptions<"radar"> = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: "nearest",
      intersect: false,
    },
    elements: {
      point: {
        radius: 6,
        hoverRadius: 10,
        hitRadius: 20,
      },
    },
    scales: {
      r: {
        angleLines: {
          display: true,
          color: "rgba(0, 0, 0, 0.25)",
          lineWidth: 1.5,
        },
        grid: {
          display: true,
          color: "rgba(0, 0, 0, 0.25)",
          lineWidth: 1.5,
        },
        pointLabels: {
          display: true,
          color: "#0f172a",
          font: { size: 12, weight: "bold" },
        },
        ticks: {
          display: true,
          color: "#475569",
          backdropColor: "transparent",
        },
      },
    },
    plugins: {
      legend: {
        display: true,
        labels: {
          color: "#0f172a",
        },
      },
      tooltip: {
        enabled: true,
        mode: "nearest",
        intersect: false,
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
    this.beerStore.beers$.subscribe({
      next: (beers: BeerCheckin[] | null) => {
        if (beers && beers.length > 0) {
          this.beers = beers;
          this.computeInsights(beers);
          this.isLoading.set(false);
          this.cdr.markForCheck();
        }
      },
      error: (err: unknown) => {
        console.error("Error loading insights beers:", err);
        this.isLoading.set(false);
        this.cdr.markForCheck();
      },
    });
  }

  private updateChartThemeOptions(theme: "light-theme" | "dark-theme"): void {
    const isLight = theme === "light-theme";
    const textColor = isLight ? "#0f172a" : "#f1f5f9";
    const gridColor = isLight
      ? "rgba(0, 0, 0, 0.25)"
      : "rgba(255, 255, 255, 0.25)";
    const tickColor = isLight ? "#475569" : "#94a3b8";
    const brandAccent = isLight ? "#0284c7" : "#38bdf8";
    const brandBg = isLight
      ? "rgba(2, 132, 199, 0.25)"
      : "rgba(56, 189, 248, 0.25)";

    this.radarChartOptions = {
      ...this.radarChartOptions,
      scales: {
        r: {
          angleLines: {
            display: true,
            color: gridColor,
            lineWidth: 1.5,
          },
          grid: {
            display: true,
            color: gridColor,
            lineWidth: 1.5,
          },
          pointLabels: {
            display: true,
            color: textColor,
            font: { size: 12, weight: "bold" },
          },
          ticks: {
            display: true,
            color: tickColor,
            backdropColor: "transparent",
          },
        },
      },
      plugins: {
        ...this.radarChartOptions.plugins,
        legend: {
          display: true,
          labels: {
            color: textColor,
          },
        },
      },
    };

    if (this.styleRadarChartData.datasets[0]) {
      this.styleRadarChartData = {
        ...this.styleRadarChartData,
        datasets: [
          {
            ...this.styleRadarChartData.datasets[0],
            backgroundColor: brandBg,
            borderColor: brandAccent,
            pointBackgroundColor: brandAccent,
          },
        ],
      };
    }

    this.cdr.markForCheck();
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

  private openBeersDialog(title: string, filtered: BeerCheckin[]): void {
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
    };

    this.dialog.open(BeerStyleDialogComponent, {
      data,
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
      .sort((a, b) => b.count - a.count || a.styleName.localeCompare(b.styleName));

    const dialogRef = this.dialog.open(StylesListDialogComponent, {
      data: {
        title: "Unique Styles Explorer",
        styles,
      },
      width: "380px",
      maxHeight: "80vh",
    });

    dialogRef.afterClosed().subscribe((selectedStyle: string | undefined) => {
      if (selectedStyle) {
        const filtered = this.beers.filter(
          (b) => (b.beer.beer_style || "Unknown") === selectedStyle,
        );
        this.openBeersDialog(`${selectedStyle} Drinks`, filtered);
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

    const uniqueStyles = new Set<string>();
    let totalABV = 0;
    let abvCount = 0;

    const breweryCounts: Record<string, number> = {};
    const monthCounts: Record<string, number> = {};

    beers.forEach((b) => {
      const style = b.beer.beer_style || "";
      uniqueStyles.add(style);

      if (b.beer.beer_abv) {
        totalABV += b.beer.beer_abv;
        abvCount++;
      }

      const styleLower = style.toLowerCase();

      if (styleLower.includes("ipa") || styleLower.includes("india pale")) {
        categoryCounts["IPA"]++;
      } else if (
        styleLower.includes("stout") ||
        styleLower.includes("porter")
      ) {
        categoryCounts["Stout / Porter"]++;
      } else if (
        styleLower.includes("sour") ||
        styleLower.includes("wild") ||
        styleLower.includes("gose") ||
        styleLower.includes("berliner weisse") ||
        styleLower.includes("lambic") ||
        styleLower.includes("coolship")
      ) {
        categoryCounts["Sour / Wild"]++;
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
        categoryCounts["Lager / Pilsner"]++;
      } else if (styleLower.includes("pale ale")) {
        categoryCounts["Pale Ale"]++;
      } else if (
        styleLower.includes("wheat") ||
        styleLower.includes("hefeweizen") ||
        styleLower.includes("witbier") ||
        styleLower.includes("dunkelweizen") ||
        styleLower.includes("weizenbock") ||
        styleLower.includes("grisette")
      ) {
        categoryCounts["Wheat"]++;
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
        categoryCounts["Belgian / Farmhouse"]++;
      } else if (
        styleLower.includes("barleywine") ||
        styleLower.includes("old ale") ||
        styleLower.includes("wee heavy") ||
        styleLower.includes("scotch ale") ||
        styleLower.includes("strong ale") ||
        styleLower.includes("doppelsticke") ||
        styleLower.includes("sticke")
      ) {
        categoryCounts["Strong Ale"]++;
      } else if (
        styleLower.includes("cider") ||
        styleLower.includes("perry") ||
        styleLower.includes("graff") ||
        styleLower.includes("mead") ||
        styleLower.includes("cyser") ||
        styleLower.includes("melomel")
      ) {
        categoryCounts["Cider / Perry / Mead"]++;
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
        categoryCounts["Wine"]++;
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
        categoryCounts["Spirit / RTD"]++;
      } else if (
        styleLower.includes("sake") ||
        styleLower.includes("junmai") ||
        styleLower.includes("daiginjo") ||
        styleLower.includes("honjozo")
      ) {
        categoryCounts["Sake"]++;
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
        categoryCounts["Non-Alcoholic / Soda / Root Beer"]++;
      } else if (
        styleLower.includes("thc") ||
        styleLower.includes("cannabinoid") ||
        styleLower.includes("cbd") ||
        styleLower.includes("hemp")
      ) {
        categoryCounts["THC / Cannabinoid"]++;
      } else if (
        styleLower.includes("fruit") ||
        styleLower.includes("shandy") ||
        styleLower.includes("radler") ||
        styleLower.includes("pumpkin") ||
        styleLower.includes("spiced") ||
        styleLower.includes("herb") ||
        styleLower.includes("vegetable")
      ) {
        categoryCounts["Fruit / Field / Spice"]++;
      } else {
        categoryCounts["Other / Specialty"]++;
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
    const brandBg = isLight
      ? "rgba(2, 132, 199, 0.25)"
      : "rgba(56, 189, 248, 0.25)";

    // Filter out categories with 0 check-ins so non-legacy categories without check-ins are excluded
    const activeCategories = Object.entries(categoryCounts).filter(
      ([, count]) => count > 0,
    );

    // Radar chart data update
    this.styleRadarChartData = {
      labels: activeCategories.map(([cat]) => cat),
      datasets: [
        {
          data: activeCategories.map(([, count]) => count),
          label: "Check-ins by Style",
          backgroundColor: brandBg,
          borderColor: brandAccent,
          pointBackgroundColor: brandAccent,
        },
      ],
    };

    // Find top category
    const topCat = activeCategories.sort((a, b) => b[1] - a[1])[0];
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
