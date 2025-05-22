import { Component, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import * as moment from "moment";

@Component({
  selector: "app-top-beers",
  templateUrl: "./top-beers.component.html",
  styleUrls: ["./top-beers.component.css"],
})
export class TopBeersComponent implements OnInit {
  public beers: any[] = [];
  public filteredBeers: any[] = [];

  // Predefined range dropdown
  public dateRangeOptions = [
    { label: "Last 30 days", daysBack: 30 },
    { label: "Last 60 days", daysBack: 60 },
    { label: "Last 90 days", daysBack: 90 },
    { label: "Last 6 months", daysBack: 180 },
    { label: "Last year", daysBack: 365 },
    { label: "2025", year: 2025 },
    { label: "2024", year: 2024 },
    { label: "2023", year: 2023 }
  ];

  public topXOptions = [5, 10, 15, 20];
  public minCheckinOptions = [1, 3, 5, 10];

  // Defaults
  public selectedRange = this.dateRangeOptions[0];
  public topX = 10;
  public minCheckins = 3;

  public useCustomDate: boolean = false;
  public customStartDate: Date = new Date();

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.getJSON().subscribe((data) => {
      this.beers = data.beers;
      this.applyFilters(); // Default on load
    });
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
    } else if (this.selectedRange.year) {
      cutoffDate = moment(`${this.selectedRange.year}-01-01`);
    } else {
      cutoffDate = moment().subtract(this.selectedRange.daysBack, "days");
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
