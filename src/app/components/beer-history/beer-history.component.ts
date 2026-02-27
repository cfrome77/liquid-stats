import { Component, OnInit, ChangeDetectorRef } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { BeerCheckin } from "src/app/core/models/beer.model";
import { DataService } from "src/app/core/services/data.service";
import { DateUtils } from "../../core/utils/date-utils";
import {
  BaseCardData,
  CardExtraData,
  MapData,
} from "../../shared/components/card/card-data.interface";
import { CardComponent } from "../../shared/components/card/card.component";
import { FilterComponent } from "../../shared/components/filter/filter.component";
import { PaginationComponent } from "../../shared/components/pagination/pagination.component";
import { PoweredByComponent } from "../../shared/components/powered-by/powered-by.component";

export interface FilterField {
  field: string;
  label: string;
  options: string[];
  selected: string[];
  countMap?: { [option: string]: number };
  type?: "text" | "date" | "number";
}

@Component({
  selector: "app-beer-history",
  templateUrl: "./beer-history.component.html",
  styleUrls: ["./beer-history.component.css"],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    CardComponent,
    FilterComponent,
    PaginationComponent,
    PoweredByComponent,
  ],
})
export class BeerHistoryComponent implements OnInit {
  public beers: (BeerCheckin | BaseCardData)[] = [];
  public filteredBeers: BaseCardData[] = [];
  public paginatedBeers: BaseCardData[] = [];
  public totalItems = 0;
  public currentPage = 1;
  public itemsPerPage = 10;
  public searchTerm = "";

  public filterFields: FilterField[] = [
    { field: "brewery", label: "Brewery", options: [], selected: [] },
    { field: "beer_style", label: "Beer Style", options: [], selected: [] },
    { field: "country", label: "Country", options: [], selected: [] },
    { field: "state", label: "State/Region", options: [], selected: [] },
    { field: "rating", label: "Ratings", options: [], selected: [], type: "number" },
    { field: "date", label: "Date Range", options: [], selected: [], type: "date" },
  ];

  constructor(
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.dataService.getBeers().subscribe({
      next: (data) => {
        this.beers = data?.beers || [];
        this.initializeFilters();
        this.applyFilters();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error("Error fetching beers:", err);
      },
    });
  }

  initializeFilters() {
    const breweries = new Set<string>();
    const styles = new Set<string>();
    const countries = new Set<string>();
    const states = new Set<string>();
    const ratings = new Set<string>();

    this.beers.forEach((beer: any) => {
      breweries.add(beer.brewery.brewery_name);
      styles.add(beer.beer.beer_style);
      countries.add(beer.brewery.country_name);
      if (beer.brewery.location.brewery_state) {
        states.add(beer.brewery.location.brewery_state);
      }
      const rating = beer.rating_score;
      const formattedRating =
        (rating * 10) % 1 === 0 ? rating.toFixed(1) : rating.toFixed(2);
      ratings.add(formattedRating);
    });

    this.setFilterOptions("brewery", Array.from(breweries).sort());
    this.setFilterOptions("beer_style", Array.from(styles).sort());
    this.setFilterOptions("country", Array.from(countries).sort());
    this.setFilterOptions("state", Array.from(states).sort());
    this.setFilterOptions(
      "rating",
      Array.from(ratings).sort((a, b) => parseFloat(b) - parseFloat(a)),
    );

    // Initial selected is everything
    this.filterFields.forEach((f) => {
      if (f.type !== "date") {
        f.selected = [...f.options];
      }
    });

    const dates = this.beers
      .map((b: any) => DateUtils.parseDate(b.recent_created_at))
      .filter((d) => !isNaN(d.getTime()));
    if (dates.length > 0) {
      const minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
      const maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
      const dateFilter = this.filterFields.find((f) => f.field === "date")!;
      dateFilter.selected = [
        DateUtils.toISODate(minDate),
        DateUtils.toISODate(maxDate),
      ];
      dateFilter.options = [
        DateUtils.toISODate(minDate),
        DateUtils.toISODate(maxDate),
      ];
    }
  }

  setFilterOptions(field: string, options: string[]) {
    const filter = this.filterFields.find((f) => f.field === field);
    if (filter) {
      filter.options = options;
    }
  }

  onFilterChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  onSearchChange() {
    this.currentPage = 1;
    this.applyFilters();
  }

  applyFilters() {
    const breweryFilter = this.filterFields.find((f) => f.field === "brewery")!;
    const styleFilter = this.filterFields.find((f) => f.field === "beer_style")!;
    const countryFilter = this.filterFields.find((f) => f.field === "country")!;
    const stateFilter = this.filterFields.find((f) => f.field === "state")!;
    const ratingFilter = this.filterFields.find((f) => f.field === "rating")!;
    const dateFilter = this.filterFields.find((f) => f.field === "date")!;

    const search = this.searchTerm.toLowerCase();

    // Reset counts
    this.filterFields.forEach((f) => (f.countMap = {}));

    const filtered = this.beers.filter((beer: any) => {
      const rating = beer.rating_score;
      const formattedRating =
        (rating * 10) % 1 === 0 ? rating.toFixed(1) : rating.toFixed(2);
      const beerDate = DateUtils.parseDate(beer.recent_created_at);

      const matchesSearch =
        !search ||
        beer.beer.beer_name.toLowerCase().includes(search) ||
        beer.beer.beer_style.toLowerCase().includes(search) ||
        beer.brewery.brewery_name.toLowerCase().includes(search) ||
        beer.brewery.country_name.toLowerCase().includes(search) ||
        beer.brewery.location.brewery_state?.toLowerCase().includes(search) ||
        beer.beer.beer_description?.toLowerCase().includes(search) ||
        beer.beer.beer_slug.toLowerCase().includes(search);

      const matchesBrewery = breweryFilter.selected.includes(
        beer.brewery.brewery_name,
      );
      const matchesStyle = styleFilter.selected.includes(beer.beer.beer_style);
      const matchesCountry = countryFilter.selected.includes(
        beer.brewery.country_name,
      );
      const matchesState =
        !beer.brewery.location.brewery_state ||
        stateFilter.selected.includes(beer.brewery.location.brewery_state);
      const matchesRating = ratingFilter.selected.includes(formattedRating);

      const startDate = dateFilter.selected[0]
        ? DateUtils.parseDate(dateFilter.selected[0])
        : null;
      const endDate = dateFilter.selected[1]
        ? DateUtils.parseDate(dateFilter.selected[1])
        : null;
      const matchesDate =
        (!startDate || beerDate >= startDate) &&
        (!endDate || beerDate <= endDate);

      // Cross-filtering counts logic
      if (matchesSearch && matchesStyle && matchesCountry && matchesState && matchesRating && matchesDate) {
        breweryFilter.countMap![beer.brewery.brewery_name] = (breweryFilter.countMap![beer.brewery.brewery_name] || 0) + 1;
      }
      if (matchesSearch && matchesBrewery && matchesCountry && matchesState && matchesRating && matchesDate) {
        styleFilter.countMap![beer.beer.beer_style] = (styleFilter.countMap![beer.beer.beer_style] || 0) + 1;
      }
      if (matchesSearch && matchesBrewery && matchesStyle && matchesState && matchesRating && matchesDate) {
        countryFilter.countMap![beer.brewery.country_name] = (countryFilter.countMap![beer.brewery.country_name] || 0) + 1;
      }
      if (matchesSearch && matchesBrewery && matchesStyle && matchesCountry && matchesRating && matchesDate) {
        if (beer.brewery.location.brewery_state) {
          stateFilter.countMap![beer.brewery.location.brewery_state] = (stateFilter.countMap![beer.brewery.location.brewery_state] || 0) + 1;
        }
      }
      if (matchesSearch && matchesBrewery && matchesStyle && matchesCountry && matchesState && matchesDate) {
        ratingFilter.countMap![formattedRating] = (ratingFilter.countMap![formattedRating] || 0) + 1;
      }

      return (
        matchesSearch &&
        matchesBrewery &&
        matchesStyle &&
        matchesCountry &&
        matchesState &&
        matchesRating &&
        matchesDate
      );
    });

    this.filteredBeers = filtered.map((b) => this.transformBeerData(b));
    this.totalItems = this.filteredBeers.length;
    this.updatePagination();
  }

  transformBeerData(beer: any): BaseCardData {
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
      venueId: undefined,
      checkinId: undefined,
    };

    return {
      title: beer.beer.beer_name,
      subtitle: beer.beer.beer_style,
      breweryName: beer.brewery.brewery_name,
      description: beer.beer.beer_description,
      rating: beer.rating_score,
      mainImage: beer.beer.beer_label,
      secondaryImage: beer.brewery.brewery_label,
      footerInfo: {
        text: beer.brewery.country_name,
        link: `https://untappd.com/b/${beer.beer.beer_slug}/${beer.beer.bid}`,
        timestamp: DateUtils.formatTimestamp(beer.recent_created_at),
      },
      extraData,
    };
  }

  updatePagination() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedBeers = this.filteredBeers.slice(startIndex, endIndex);
  }

  goToPage(page: number) {
    this.currentPage = page;
    this.updatePagination();
    window.scrollTo(0, 0);
  }

  changeItemsPerPage(items: number) {
    this.itemsPerPage = items;
    this.currentPage = 1;
    this.updatePagination();
  }

  resetFilters() {
    this.searchTerm = "";
    this.filterFields.forEach((f) => {
      if (f.type === "date") {
        f.selected = [f.options[0], f.options[1]];
      } else {
        f.selected = [...f.options];
      }
    });
    this.onFilterChange();
  }
}
