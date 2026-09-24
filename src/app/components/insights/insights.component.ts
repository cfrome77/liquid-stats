import {
  Component,
  OnInit,
  ChangeDetectorRef,
  ChangeDetectionStrategy,
  inject,
  signal,
} from "@angular/core";
import { CommonModule, DecimalPipe } from "@angular/common";
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import {
  BaseChartDirective,
  provideCharts,
  withDefaultRegisterables,
} from "ng2-charts";
import { ChartData, ChartOptions } from "chart.js";

import { BeerStoreService } from "src/app/core/services/beer-store.service";
import { BeerCheckin } from "src/app/core/models/beer.model";
import { SkeletonCardComponent } from "../../shared/components/skeleton-card/skeleton-card.component";

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
    BaseChartDirective,
    SkeletonCardComponent,
  ],
  providers: [DecimalPipe, provideCharts(withDefaultRegisterables())],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InsightsComponent implements OnInit {
  private beerStore = inject(BeerStoreService);
  private cdr = inject(ChangeDetectorRef);

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
        backgroundColor: "rgba(56, 189, 248, 0.2)",
        borderColor: "#38bdf8",
        pointBackgroundColor: "#38bdf8",
      },
    ],
  };

  public radarChartOptions: ChartOptions<"radar"> = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        angleLines: { color: "rgba(255, 255, 255, 0.1)" },
        grid: { color: "rgba(255, 255, 255, 0.1)" },
        pointLabels: {
          font: { size: 12, weight: "bold" },
        },
      },
    },
  };

  ngOnInit(): void {
    this.beerStore.load();
    this.beerStore.beers$.subscribe({
      next: (beers: BeerCheckin[] | null) => {
        if (beers && beers.length > 0) {
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

  private computeInsights(beers: BeerCheckin[]): void {
    const categoryCounts: Record<string, number> = {
      IPA: 0,
      "Stout / Porter": 0,
      "Sour / Wild": 0,
      "Lager / Pilsner": 0,
      "Pale Ale": 0,
      Wheat: 0,
      "Belgian / Strong": 0,
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
        styleLower.includes("gose")
      ) {
        categoryCounts["Sour / Wild"]++;
      } else if (
        styleLower.includes("lager") ||
        styleLower.includes("pilsner") ||
        styleLower.includes("pils")
      ) {
        categoryCounts["Lager / Pilsner"]++;
      } else if (styleLower.includes("pale ale")) {
        categoryCounts["Pale Ale"]++;
      } else if (
        styleLower.includes("wheat") ||
        styleLower.includes("hefeweizen") ||
        styleLower.includes("witbier")
      ) {
        categoryCounts["Wheat"]++;
      } else {
        categoryCounts["Belgian / Strong"]++;
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

    // Radar chart data update
    this.styleRadarChartData = {
      labels: Object.keys(categoryCounts),
      datasets: [
        {
          data: Object.values(categoryCounts),
          label: "Check-ins by Style",
          backgroundColor: "rgba(56, 189, 248, 0.25)",
          borderColor: "#38bdf8",
          pointBackgroundColor: "#38bdf8",
        },
      ],
    };

    // Find top category
    const topCat = Object.entries(categoryCounts).sort(
      (a, b) => b[1] - a[1],
    )[0];
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
        subtitle: "Unique beer sub-styles tried",
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
