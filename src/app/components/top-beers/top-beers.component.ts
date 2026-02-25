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
import { DateUtils } from "../../core/utils/date-utils";
import { CardComponent } from "../../shared/components/card/card.component";
import {
  BaseCardData,
  CardExtraData,
  MapData,
} from "../../shared/components/card/card-data.interface";
import { BadgeDialogComponent } from "../../shared/components/badge-dialog/badge-dialog.component";
import { BeerStyleDialogComponent } from "../../shared/components/beer-style-dialog/beer-style-dialog.component";
import { environment } from "../../../environments/environment";

type DateRangeOption = { label: string; daysBack?: number; year?: number };

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
  ],
})
export class TopBeersComponent implements OnInit {
  public beers: BeerCheckin[] = [];
  public transformedTopBeers: BaseCardData[] = [];

  // Filter state
  public useCustomDate = false;
  public selectedRange!: DateRangeOption;
  public customStartDate: Date | null = null;
  public topX = 10;
  public minCheckins = 1;

  public dateRangeOptions: DateRangeOption[] = [
    { label: "Last 30 days", daysBack: 30 },
    { label: "Last 60 days", daysBack: 60 },
    { label: "Last 90 days", daysBack: 90 },
    { label: "Last 6 months", daysBack: 180 },
    { label: "Last year", daysBack: 365 },
  ];

  public topXOptions = [5, 10, 15, 20];
  public minCheckinOptions = [1, 3, 5, 10];

  username = environment.UNTAPPD_USERNAME;

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    private dialog: MatDialog,
  ) {
    this.selectedRange = this.dateRangeOptions[0];
  }

  ngOnInit(): void {
    this.dataService.getBeers().subscribe({
      next: (data) => {
        this.beers = data.beers as BeerCheckin[];
        this.onFilterChange();
        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error fetching beers:", err),
      complete: () => console.log("Beers fetch completed"),
    });
  }

  // Optional: add individual year options
  private addYearOptions(startYear: number) {
    const currentYear = new Date().getFullYear();
    for (let year = currentYear; year >= startYear; year--) {
      this.dateRangeOptions.push({ label: `${year}`, year });
    }
  }

  onFilterChange() {
    this.filterAndRankBeers();
  }

  private filterAndRankBeers() {
    let cutoffDate: Date;

    if (this.useCustomDate && this.customStartDate) {
      cutoffDate = this.customStartDate;
    } else if (this.selectedRange?.year !== undefined) {
      cutoffDate = new Date(this.selectedRange.year, 0, 1);
    } else {
      cutoffDate = DateUtils.subtractDays(this.selectedRange.daysBack || 30);
    }

    // Filter beers based on date and minCheckins using `count`
    const filteredBeers = this.beers
      .filter((b) => {
        const beerDate = DateUtils.parseDate(b.recent_created_at);
        const count = b.count ?? 1;
        return beerDate >= cutoffDate && count >= this.minCheckins;
      })
      .sort((a, b) => {
        // Sort by rating first, then count
        if ((b.rating_score ?? 0) !== (a.rating_score ?? 0)) {
          return (b.rating_score ?? 0) - (a.rating_score ?? 0);
        }
        return (b.count ?? 1) - (a.count ?? 1);
      })
      .slice(0, this.topX);

    // Transform to card data
    this.transformedTopBeers = filteredBeers.map((b, idx) =>
      this.transformToCardData(b, idx + 1),
    );

    this.cdr.detectChanges();
  }

  private transformToCardData(beer: BeerCheckin, rank: number): BaseCardData {
    const mapData: MapData | undefined = beer.brewery?.location
      ? {
          lat: beer.brewery.location.lat,
          lng: beer.brewery.location.lng,
          breweryId: beer.brewery.brewery_id,
        }
      : undefined;

    const extraData: CardExtraData = {
      badges: [],
      socialLinks: beer.brewery?.contact,
      mapData,
      checkinId: beer.recent_checkin_id,
      userName: this.username,
    };

    return {
      title: beer.beer.beer_name,
      subtitle: beer.beer.beer_style,
      breweryName: beer.brewery.brewery_name,
      rating: beer.rating_score ?? 0,
      mainImage: beer.beer.beer_label,
      secondaryImage: beer.brewery?.brewery_label,
      rank,
      footerInfo: {
        text: `Check-ins: ${beer.count ?? 1}`,
        link: `https://untappd.com/b/${beer.beer.beer_slug}/${beer.beer.bid}`,
        timestamp: `Last: ${DateUtils.getTimeAgo(
          DateUtils.parseDate(beer.recent_created_at),
        )}`,
      },
      extraData,
    };
  }

  openBadgeDialog(event: { event: MouseEvent; badge: any }) {
    this.dialog.open(BadgeDialogComponent, {
      width: "400px",
      data: event.badge,
    });
  }

  openStyleDialog(style: string) {
    const beersInStyle = this.beers.filter((b) => b.beer.beer_style === style);
    this.dialog.open(BeerStyleDialogComponent, {
      data: { style, beers: beersInStyle },
      width: "600px",
    });
  }
}
