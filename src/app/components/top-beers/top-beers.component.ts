import { Component, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import * as moment from "moment";

type DateRangeOption = { label: string; daysBack?: number; year?: number };

@Component({
  selector: "app-top-beers",
  templateUrl: "./top-beers.component.html",
  styleUrls: ["./top-beers.component.css"],
})
export class TopBeersComponent implements OnInit {
  public beers: any[] = [];
  public filteredBeers: any[] = [];

  public dateRangeOptions: DateRangeOption[] = [
    { label: "Last 30 days", daysBack: 30 },
    { label: "Last 60 days", daysBack: 60 },
    { label: "Last 90 days", daysBack: 90 },
    { label: "Last 6 months", daysBack: 180 },
    { label: "Last year", daysBack: 365 }
  ];

  public topXOptions = [5, 10, 15, 20];
  public minCheckinOptions = [1, 3, 5, 10];

  public selectedRange: DateRangeOption = this.dateRangeOptions[0];
  public topX = 10;
  public minCheckins = 3;

  public useCustomDate: boolean = false;
  public customStartDate: Date = new Date();

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.addYearOptions(2018);
    this.getJSON().subscribe((data) => {
      this.beers = data.beers;
      this.applyFilters();
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

  public getJSON(): Observable<any> {
    return this.http.get("https://liquid-stats.s3.amazonaws.com/beers.json");
  }

  public published(createAt: string) {
    return moment(Date.parse(createAt)).format("h:mm A D MMM YYYY");
  }

  public applyFilters(): void {
    let cutoffDate: moment.Moment;

    if (this.useCustomDate && this.customStartDate) {
      cutoffDate = moment(this.customStartDate);
    } else if (this.selectedRange?.year !== undefined) {
      cutoffDate = moment(`${this.selectedRange.year}-01-01`);
    } else if (this.selectedRange?.daysBack !== undefined) {
      cutoffDate = moment().subtract(this.selectedRange.daysBack, "days");
    } else {
      cutoffDate = moment().subtract(30, "days"); // fallback
    }

    this.filteredBeers = this.beers
      .filter((b: any) => {
        const checkinDate = moment(b.recent_created_at, "ddd, DD MMM YYYY HH:mm:ss Z");
        return (
          b.rating_score > 0 &&
          checkinDate.isAfter(cutoffDate) &&
          b.count >= this.minCheckins
        );
      })
      .sort((a: any, b: any) => {
        if (b.rating_score === a.rating_score) {
          return moment(b.recent_created_at).valueOf() - moment(a.recent_created_at).valueOf();
        }
        return b.rating_score - a.rating_score;
      })
      .slice(0, this.topX);
  }

  public onFilterChange(): void {
    this.applyFilters();
  }
}
