import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { BadgeDialogComponent } from "../../shared/components/badge-dialog/badge-dialog.component";
import { BaseCardData } from "../../shared/components/card/card-data.interface";
import { DataService } from "src/app/core/services/data.service";
import { environment } from "../../../environments/environment";

import { BeerCheckin } from "src/app/core/models/beer.model"; // ✅ use BeerCheckin
import { DateUtils } from "../../core/utils/date-utils";

type DateRangeOption = { label: string; daysBack?: number; year?: number };

@Component({
  selector: "app-top-beers",
  templateUrl: "./top-beers.component.html",
  styleUrls: ["./top-beers.component.css"],
  standalone: false,
})
export class TopBeersComponent implements OnInit {
  public beers: BeerCheckin[] = []; // ✅ use BeerCheckin[]
  public filteredBeers: BeerCheckin[] = [];
  public transformedTopBeers: BaseCardData[] = [];

  public dateRangeOptions: DateRangeOption[] = [
    { label: "Last 30 days", daysBack: 30 },
    { label: "Last 60 days", daysBack: 60 },
    { label: "Last 90 days", daysBack: 90 },
    { label: "Last 6 months", daysBack: 180 },
    { label: "Last year", daysBack: 365 },
  ];

  public topXOptions = [5, 10, 15, 20];
  public minCheckinOptions = [1, 3, 5, 10];

  public selectedRange: DateRangeOption = this.dateRangeOptions[0];
  public topX = 10;
  public minCheckins = 3;

  public useCustomDate = false;
  public customStartDate: Date = new Date();

  username: string;

  constructor(
    private dataService: DataService,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef,
  ) {
    this.username = environment.untappdUsername;
  }

  ngOnInit(): void {
    this.addYearOptions(2018);

    // ✅ fetch BeerCheckin[] instead of Beer[]
    this.dataService.getBeers().subscribe({
      next: (data) => {
        this.beers = data.beers as BeerCheckin[];
        this.applyFilters();
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

  private addYearOptions(startYear: number): void {
    const currentYear = new Date().getFullYear();
    const years: DateRangeOption[] = [];

    for (let year = currentYear; year >= startYear; year--) {
      years.push({ label: `${year}`, year });
    }

    this.dateRangeOptions.push(...years);
  }

  public published(createdAt: string | Date): string {
    return DateUtils.formatTimestamp(createdAt);
  }

  public applyFilters(): void {
    let cutoffDate: Date;

    if (this.useCustomDate && this.customStartDate) {
      cutoffDate = this.customStartDate;
    } else if (this.selectedRange?.year !== undefined) {
      cutoffDate = new Date(this.selectedRange.year, 0, 1);
    } else if (this.selectedRange?.daysBack !== undefined) {
      cutoffDate = DateUtils.subtractDays(this.selectedRange.daysBack);
    } else {
      cutoffDate = DateUtils.subtractDays(30);
    }

    const filtered = this.beers
      .filter((b: BeerCheckin) => {
        const checkinDate = DateUtils.parseDate(b.recent_created_at);
        return (
          b.rating_score > 0 &&
          checkinDate >= cutoffDate &&
          (b.count ?? 1) >= this.minCheckins
        );
      })
      .sort((a: BeerCheckin, b: BeerCheckin) => {
        if (b.rating_score === a.rating_score) {
          return (
            DateUtils.toTimestamp(DateUtils.parseDate(b.recent_created_at)) -
            DateUtils.toTimestamp(DateUtils.parseDate(a.recent_created_at))
          );
        }
        return b.rating_score - a.rating_score;
      })
      .slice(0, this.topX);

    this.filteredBeers = filtered;

    this.transformedTopBeers = filtered.map((beer: BeerCheckin, index: number) =>
      this.transformTopBeersData(beer, index + 1),
    );
    this.cdr.detectChanges();
  }

  public onFilterChange(): void {
    this.applyFilters();
  }

  openBadgeDialog(badge: any): void {
    this.dialog.open(BadgeDialogComponent, {
      width: "400px",
      data: badge,
    });
  }

  transformTopBeersData(beer: BeerCheckin, rank?: number): BaseCardData {
    const beerSlug =
      beer.beer.beer_slug ||
      beer.beer.beer_name.toLowerCase().replace(/ /g, "-");
    return {
      title: beer.beer.beer_name,
      subtitle: beer.beer.beer_style,
      breweryName: beer.brewery.brewery_name,
      description: undefined,
      rating: beer.rating_score,
      globalRating: beer.rating_score > 0 ? beer.rating_score : undefined,
      mainImage: beer.beer.beer_label,
      secondaryImage: undefined,
      footerInfo: {
        text: "Brewery Info",
        link: `https://untappd.com${beer.brewery.brewery_page_url}` || `https://untappd.com/b/${beerSlug}/${beer.beer.bid}`,
        timestamp: this.published(beer.recent_created_at),
        rightLinkText: "Beer Details",
      },
      extraData: {
        badges: [],
        socialLinks: undefined, // not in BeerCheckin
        mapData: {
          lat: undefined,
          lng: undefined,
          breweryId: undefined,
        },
        venueId: undefined,
        checkinId: beer.recent_checkin_id,
        userName: this.username,
      },
      rank,
    };
  }
}
