import { Component, OnInit, ChangeDetectorRef, inject } from "@angular/core";

import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatInputModule } from "@angular/material/input";
import { MatDatepickerModule } from "@angular/material/datepicker";
import {
  MatNativeDateModule,
  provideNativeDateAdapter,
} from "@angular/material/core";
import { MatRadioModule } from "@angular/material/radio";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";

import { BeerCheckin } from "src/app/core/models/beer.model";
import { DataService } from "src/app/core/services/data.service";
import {
  BaseCardData,
  CardExtraData,
  MapData,
} from "../../shared/components/card/card-data.interface";
import { DateUtils } from "../../core/utils/date-utils";
import { CardComponent } from "../../shared/components/card/card.component";
import { BeerStyleDialogComponent } from "../../shared/components/beer-style-dialog/beer-style-dialog.component";

type DateRangeOption = { label: string; daysBack?: number };

@Component({
  selector: "app-top-beers",
  templateUrl: "./top-beers.component.html",
  styleUrls: ["./top-beers.component.css"],
  standalone: true,
  imports: [
    FormsModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatRadioModule,
    MatDialogModule,
    CardComponent,
  ],
  providers: [provideNativeDateAdapter()],
})
export class TopBeersComponent implements OnInit {
  private dataService = inject(DataService);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);

  public beers: BeerCheckin[] = [];
  public transformedTopBeers: BaseCardData[] = [];

  // Filter state
  public useCustomDate = false;
  public selectedRange: DateRangeOption;
  public customStartDate: Date | null = null;
  public topX = 5;
  public minCheckins = 1;

  public dateRangeOptions: DateRangeOption[] = [
    { label: "Overall", daysBack: 3650 },
    { label: "Last Year", daysBack: 365 },
    { label: "Last 6 Months", daysBack: 180 },
    { label: "Last Month", daysBack: 30 },
    { label: "Custom Start Date...", daysBack: -1 },
  ];

  public topXOptions = [3, 5, 10, 15];
  public minCheckinOptions = [1, 2, 3, 5, 10];

  constructor() {
    this.selectedRange = this.dateRangeOptions[0];
  }

  ngOnInit(): void {
    this.dataService.getBeersAll().subscribe({
      next: (data) => {
        this.beers = data;
        this.onFilterChange();
      },
      error: (err) => console.error("Error fetching beers:", err),
    });
  }

  onFilterChange() {
    if (this.selectedRange.daysBack === -1) {
      this.useCustomDate = true;
    } else {
      this.useCustomDate = false;
    }
    this.filterAndRankBeers();
  }

  filterAndRankBeers() {
    if (!this.beers || !Array.isArray(this.beers)) {
      this.transformedTopBeers = [];
      this.cdr.markForCheck();
      return;
    }

    let cutoffDate: Date;

    const isOverall =
      !this.useCustomDate && this.selectedRange?.label === "Overall";

    if (this.useCustomDate && this.customStartDate) {
      cutoffDate = this.customStartDate;
    } else {
      const days = this.selectedRange?.daysBack ?? 3650;
      cutoffDate = DateUtils.subtractDays(days);
    }

    const beerGroups = new Map<number, BeerCheckin[]>();

    this.beers.forEach((b) => {
      const dateStr =
        b.recent_created_at ||
        (b as unknown as { created_at: string }).created_at;
      const beerDate = DateUtils.parseDate(dateStr);

      if (isOverall || beerDate >= cutoffDate) {
        const bid = b.beer.bid;
        if (!beerGroups.has(bid)) {
          beerGroups.set(bid, []);
        }
        beerGroups.get(bid)!.push(b);
      }
    });

    const sortedBeers = Array.from(beerGroups.values())
      .map((group) => {
        const totalCheckins = group.reduce((sum, b) => sum + (b.count || 1), 0);
        // Calculate weighted average rating
        const ratingsWithCount = group.filter((b) => b.rating_score > 0);
        const totalWeightedRating = ratingsWithCount.reduce(
          (acc, b) => acc + b.rating_score * (b.count || 1),
          0,
        );
        const totalRatedCheckins = ratingsWithCount.reduce(
          (acc, b) => acc + (b.count || 1),
          0,
        );
        const avgRating =
          totalRatedCheckins > 0 ? totalWeightedRating / totalRatedCheckins : 0;

        return {
          ...group[0],
          totalCheckins: totalCheckins,
          avgRating: avgRating,
        };
      })
      .filter((beer) => beer.totalCheckins >= this.minCheckins)
      .sort(
        (a, b) =>
          b.avgRating - a.avgRating || b.totalCheckins - a.totalCheckins,
      )
      .slice(0, this.topX);

    this.transformedTopBeers = sortedBeers.map((b, index) =>
      this.transformToCardData(b, index + 1),
    );

    this.cdr.markForCheck();
  }

  transformToCardData(
    beer: BeerCheckin & { totalCheckins: number; avgRating: number },
    rank: number,
  ): BaseCardData {
    const mapData: MapData | undefined =
      beer.brewery?.location &&
      beer.brewery.location.lat !== undefined &&
      beer.brewery.location.lng !== undefined &&
      beer.brewery.brewery_id !== undefined
        ? {
            lat: beer.brewery.location.lat,
            lng: beer.brewery.location.lng,
            breweryId: beer.brewery.brewery_id.toString(),
          }
        : undefined;

    const extraData: CardExtraData = {
      badges: [],
      socialLinks: beer.brewery.contact as unknown as Record<
        string,
        string | number | boolean | undefined
      >,
      mapData,
    };

    return {
      title: beer.beer.beer_name,
      subtitle: beer.beer.beer_style,
      breweryName: beer.brewery.brewery_name,
      rating: beer.avgRating,
      globalRating: beer.beer.rating_score,
      mainImage: beer.beer.beer_label,
      secondaryImage: beer.brewery.brewery_label,
      rank: rank,
      footerInfo: {
        text: `Check-ins: ${beer.totalCheckins}`,
        link: `https://untappd.com/b/${beer.beer.beer_slug}/${beer.beer.bid}`,
        timestamp: `Last: ${DateUtils.getTimeAgo(DateUtils.parseDate(beer.recent_created_at))}`,
      },
      extraData,
    };
  }

  openStyleDialog(style: string) {
    const beersInStyle = this.beers.filter((b) => b.beer.beer_style === style);
    this.dialog.open(BeerStyleDialogComponent, {
      data: { style, beers: beersInStyle },
      width: "600px",
    });
  }
}
