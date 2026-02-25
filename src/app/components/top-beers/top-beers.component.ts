import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatInputModule } from "@angular/material/input";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
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
import { PoweredByComponent } from "../../shared/components/powered-by/powered-by.component";
import { BeerStyleDialogComponent } from "../../shared/components/beer-style-dialog/beer-style-dialog.component";

type DateRangeOption = { label: string; daysBack?: number };

@Component({
  selector: "app-top-beers",
  templateUrl: "./top-beers.component.html",
  styleUrls: ["./top-beers.component.css"],
  standalone: true,
  imports: [
    CommonModule,
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
    PoweredByComponent,
  ],
})
export class TopBeersComponent implements OnInit {
  public beers: BeerCheckin[] = [];
  public transformedTopBeers: BaseCardData[] = [];

  // Filter state
  public useCustomDate = false;
  public selectedRange: DateRangeOption;
  public customStartDate: Date | null = null;
  public topX = 25;
  public minCheckins = 1;

  public dateRangeOptions: DateRangeOption[] = [
    { label: "Overall", daysBack: 3650 },
    { label: "Last Year", daysBack: 365 },
    { label: "Last 6 Months", daysBack: 180 },
    { label: "Last Month", daysBack: 30 },
  ];

  public topXOptions = [10, 25, 50, 100];
  public minCheckinOptions = [1, 2, 3, 5, 10];

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog
  ) {
    this.selectedRange = this.dateRangeOptions[0];
  }

  ngOnInit(): void {
    this.dataService.getBeers().subscribe({
      next: (data) => {
        this.beers = data?.response?.checkins?.items || [];
        this.onFilterChange();
      },
      error: (err) => console.error("Error fetching beers:", err),
    });
  }

  onFilterChange() {
    this.filterAndRankBeers();
  }

  filterAndRankBeers() {
    let cutoffDate: Date;
    if (this.useCustomDate && this.customStartDate) {
      cutoffDate = this.customStartDate;
    } else {
      cutoffDate = DateUtils.subtractDays(this.selectedRange.daysBack || 0);
    }

    // Grouping by Beer ID (bid) to be more accurate than name
    const beerGroups = new Map<number, BeerCheckin[]>();
    this.beers.forEach((b) => {
      const beerDate = DateUtils.parseDate(b.recent_created_at);
      if (beerDate >= cutoffDate) {
        const bid = b.beer.bid;
        if (!beerGroups.has(bid)) {
          beerGroups.set(bid, []);
        }
        beerGroups.get(bid)!.push(b);
      }
    });

    // Calculate ranking and filter by min check-ins
    const sortedBeers = Array.from(beerGroups.values())
      .filter(group => group.length >= this.minCheckins)
      .map((group) => {
        const avgRating =
          group.reduce((acc, b) => acc + b.rating_score, 0) / group.length;
        return {
          ...group[0],
          totalCheckins: group.length,
          avgRating: avgRating,
        };
      })
      .sort((a, b) => {
        if (b.avgRating !== a.avgRating) {
          return b.avgRating - a.avgRating;
        }
        return b.totalCheckins - a.totalCheckins;
      })
      .slice(0, this.topX);

    this.transformedTopBeers = sortedBeers.map((b, index) =>
      this.transformToCardData(b, index + 1),
    );

    this.cdr.detectChanges();
  }

  transformToCardData(beer: any, rank: number): BaseCardData {
    const mapData: MapData | undefined = beer.brewery?.location
      ? {
          lat: beer.brewery.location.lat,
          lng: beer.brewery.location.lng,
          breweryId: beer.brewery.brewery_id,
        }
      : undefined;

    const extraData: CardExtraData = {
      badges: [],
      socialLinks: beer.brewery.contact,
      mapData,
    };

    return {
      title: beer.beer.beer_name,
      subtitle: beer.beer.beer_style,
      breweryName: beer.brewery.brewery_name,
      rating: beer.avgRating,
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

  openBadgeDialog(event: { event: MouseEvent; badge: any }) {
    // This is a placeholder since we don't have badges here yet,
    // but the template might call it if we added badges to extraData
  }

  openStyleDialog(style: string) {
    const beersInStyle = this.beers.filter(b => b.beer.beer_style === style);
    this.dialog.open(BeerStyleDialogComponent, {
      data: { style, beers: beersInStyle },
      width: '600px'
    });
  }
}
