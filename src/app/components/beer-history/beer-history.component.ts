import { Component, OnInit } from "@angular/core";
import { Router } from "@angular/router";
import { BaseCardData } from "../../shared/components/card/card-data.interface";
import { environment } from "../../../environments/environment";
import { DataService } from "src/app/core/services/data.service";
import { DateUtils } from "src/app/core/utils/date-utils";
import { BeerCheckin } from "src/app/core/models/beer.model"; // ✅ use BeerCheckin

interface FilterField {
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
})
export class BeerHistoryComponent implements OnInit {
  public beers: any[] = [];
  public filteredBeers: any[] = [];
  public paginatedBeers: BaseCardData[] = [];
  public currentPage = 1;
  public itemsPerPage = 10;
  public totalItems = 0;
  public searchTerm = "";
  username: string;

  public filterFields: FilterField[] = [
    {
      field: "brewery",
      label: "Brewery",
      options: [],
      selected: [],
      countMap: {},
    },
    {
      field: "beer_style",
      label: "Beer Style",
      options: [],
      selected: [],
      countMap: {},
    },
    {
      field: "country",
      label: "Country",
      options: [],
      selected: [],
      countMap: {},
    },
    {
      field: "region",
      label: "State/Region",
      options: [],
      selected: [],
      countMap: {},
    },
    {
      field: "rating",
      label: "Ratings",
      options: [],
      selected: [],
      countMap: {},
    },
    {
      field: "date_range",
      label: "Date Range",
      options: [],
      selected: [],
      type: "date",
    },
  ];

  constructor(
    private dataService: DataService,
    private router: Router
  ) {
    this.username = environment.untappdUsername;
  }

  ngOnInit(): void {
    this.fetchBeersData();
  }

  private fetchBeersData(): void {
    this.dataService.getBeers().subscribe({
      next: (data) => {
        let beersArray: any[] = [];
        if (Array.isArray(data)) {
          beersArray = data;
        } else if (data && data.beers && Array.isArray(data.beers)) {
          beersArray = data.beers;
        }

        if (beersArray.length > 0) {
          const parseDate = (dateStr: string): Date => {
            if (!dateStr) return new Date();
            const d = new Date(dateStr);
            return isNaN(d.getTime()) ? new Date() : d;
          };

          this.beers = beersArray.sort((a, b) => {
            const dateA = parseDate(
              a.first_created_at || a.recent_created_at || a.footerInfo?.timestamp
            );
            const dateB = parseDate(
              b.first_created_at || b.recent_created_at || b.footerInfo?.timestamp
            );
            return dateB.getTime() - dateA.getTime();
          });

          const timestamps = this.beers.map((b) =>
            parseDate(
              b.first_created_at || b.recent_created_at || b.footerInfo?.timestamp
            )
          );

          this.filteredBeers = [...this.beers];
          this.totalItems = this.beers.length;

          // setup date range filter
          const minDate = DateUtils.toISODate(DateUtils.minDate(timestamps));
          const maxDate = DateUtils.toISODate(DateUtils.maxDate(timestamps));
          const today = DateUtils.toISODate(new Date());
          const dateFilter = this.filterFields.find(
            (f) => f.field === "date_range"
          );
          if (dateFilter) {
            dateFilter.options = [minDate, maxDate];
            // Initial selected range: default "From" to today as requested
            dateFilter.selected = [today, maxDate];
          }

          // setup ratings
          const quarterPointScale = Array.from({ length: 21 }, (_, i) =>
            (i * 0.25).toFixed(2)
          );
          const tenthPointScale = Array.from({ length: 51 }, (_, i) =>
            (i * 0.1).toFixed(1)
          );
          const combinedRatings = Array.from(
            new Set([
              ...quarterPointScale.map((val) => parseFloat(val)),
              ...tenthPointScale.map((val) => parseFloat(val)),
            ])
          ).sort((a, b) => a - b);
          const formattedRatings = combinedRatings.map((rating) =>
            Number.isInteger(rating * 100) && (rating * 10) % 10 === 0
              ? rating.toFixed(1)
              : rating.toFixed(2)
          );

          this.filterFields[0].options =
            this.getUniqueFieldValues("brewery").sort();
          this.filterFields[1].options =
            this.getUniqueFieldValues("beer_style").sort();
          this.filterFields[2].options =
            this.getUniqueFieldValues("country").sort();
          this.filterFields[3].options =
            this.getUniqueFieldValues("region").sort();
          this.filterFields[4].options = formattedRatings;

          this.updateOptionCounts();
          this.resetFilters();
        } else {
          console.error("Beers data is not in an expected format", data);
        }
      },
      error: (err) => {
        console.error("Error fetching beers:", err);
      },
      complete: () => {
        console.log("Beers fetch completed");
      },
    });
  }

  // ✅ Convert BeerCheckin into BaseCardData
  public transformBeerData(beer: any): BaseCardData {
    if (beer.title && beer.subtitle) {
      return beer as BaseCardData;
    }
    return {
      title: beer.beer?.beer_name || "Unknown Beer",
      subtitle: beer.beer?.beer_style || "Unknown Style",
      breweryName: beer.brewery?.brewery_name || "Unknown Brewery",
      description: beer.beer?.beer_description || "",
      rating: beer.rating_score || 0,
      globalRating: beer.beer?.rating_score,
      mainImage: beer.beer?.beer_label,
      secondaryImage: beer.brewery?.brewery_label,
      footerInfo: {
        text: "View Details",
        link: beer.beer
          ? `https://untappd.com/b/${beer.beer.beer_slug}/${beer.beer.bid}`
          : "",
        timestamp: this.published(
          beer.recent_created_at ||
            beer.first_created_at ||
            beer.footerInfo?.timestamp
        ),
      },
      extraData: {
        socialLinks: beer.brewery?.contact,
        mapData: {
          lat: beer.brewery?.location?.lat,
          lng: beer.brewery?.location?.lng,
          breweryId: beer.brewery?.brewery_id,
        },
        venueId: beer.brewery?.brewery_id,
        checkinId: beer.recent_checkin_id,
        userName: this.username,
      },
    };
  }

  private getUniqueFieldValues(field: string): string[] {
    let values: string[] = [];

    if (field === "brewery") {
      values = this.beers
        .map((beer) => beer.brewery?.brewery_name || beer.breweryName)
        .filter(Boolean) as string[];
    } else if (field === "beer_style") {
      values = this.beers
        .map((beer) => beer.beer?.beer_style || beer.subtitle)
        .filter(Boolean) as string[];
    } else if (field === "country") {
      values = this.beers
        .map((beer) => beer.brewery?.country_name || beer.country)
        .filter(Boolean) as string[];
    } else if (field === "region") {
      values = this.beers
        .map((beer) => beer.brewery?.location?.brewery_state || beer.state)
        .filter(Boolean) as string[];
    }

    return [...new Set(values)];
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  public applyFilters(): void {
    const selectedBreweries =
      this.filterFields.find((f) => f.field === "brewery")?.selected || [];
    const selectedStyles =
      this.filterFields.find((f) => f.field === "beer_style")?.selected || [];
    const selectedCountries =
      this.filterFields.find((f) => f.field === "country")?.selected || [];
    const selectedRegions =
      this.filterFields.find((f) => f.field === "region")?.selected || [];
    const selectedRatings =
      this.filterFields
        .find((f) => f.field === "rating")
        ?.selected.map((r) => parseFloat(r)) || [];
    const dateRange =
      this.filterFields.find((f) => f.field === "date_range")?.selected || [];
    const searchTermLower = this.searchTerm.toLowerCase();

    const startDate = dateRange[0]
      ? DateUtils.startOfDay(dateRange[0])
      : new Date("1900-01-01");
    const endDate = dateRange[1]
      ? DateUtils.endOfDay(dateRange[1])
      : DateUtils.endOfDay(new Date());

    this.filteredBeers = this.beers.filter((beer) => {
      const brewery = beer.brewery?.brewery_name || beer.breweryName || "";
      const style = beer.beer?.beer_style || beer.subtitle || "";
      const country = beer.brewery?.country_name || beer.country || "";
      const region =
        beer.brewery?.location?.brewery_state || beer.state || "";
      const rating = beer.rating_score !== undefined ? beer.rating_score : (beer.rating || 0);
      const beerDate = new Date(
        beer.first_created_at || beer.recent_created_at || beer.footerInfo?.timestamp
      );

      const matchBrewery =
        !selectedBreweries ||
        selectedBreweries.length === 0 ||
        selectedBreweries.includes(brewery);
      const matchStyle =
        !selectedStyles ||
        selectedStyles.length === 0 ||
        selectedStyles.includes(style);
      const matchCountry =
        !selectedCountries ||
        selectedCountries.length === 0 ||
        selectedCountries.includes(country);
      const matchRegion =
        !selectedRegions ||
        selectedRegions.length === 0 ||
        selectedRegions.includes(region);
      const matchRating =
        !selectedRatings ||
        selectedRatings.length === 0 ||
        selectedRatings.includes(rating);
      const matchDate = beerDate >= startDate && beerDate <= endDate;

      const beerName = beer.beer?.beer_name || beer.title || "";
      const beerDesc = beer.beer?.beer_description || beer.description || "";

      const matchSearch =
        this.searchTerm === "" ||
        beerName.toLowerCase().includes(searchTermLower) ||
        style.toLowerCase().includes(searchTermLower) ||
        brewery.toLowerCase().includes(searchTermLower) ||
        country.toLowerCase().includes(searchTermLower) ||
        region.toLowerCase().includes(searchTermLower) ||
        beerDesc.toLowerCase().includes(searchTermLower);

      return (
        matchBrewery &&
        matchStyle &&
        matchCountry &&
        matchRegion &&
        matchRating &&
        matchDate &&
        matchSearch
      );
    });

    this.totalItems = this.filteredBeers.length;
    this.updateOptionCounts();
    this.updatePaginatedBeers();
  }

  updateOptionCounts(): void {
    this.filterFields.forEach((currentFilter) => {
      const countMap: { [option: string]: number } = {};

      this.beers.forEach((beer) => {
        const passesOtherFilters = this.filterFields.every((f) => {
          if (f === currentFilter) return true;
          if (!f.selected || f.selected.length === 0) return true;

          let beerValue = "";
          if (f.field === "brewery")
            beerValue = beer.brewery?.brewery_name || beer.breweryName || "";
          else if (f.field === "beer_style")
            beerValue = beer.beer?.beer_style || beer.subtitle || "";
          else if (f.field === "country")
            beerValue = beer.brewery?.country_name || beer.country || "";
          else if (f.field === "region")
            beerValue = beer.brewery?.location?.brewery_state || beer.state || "";
          else if (f.field === "rating") {
            const raw = beer.rating_score !== undefined ? beer.rating_score : beer.rating;
            if (raw !== undefined && raw !== null) {
              const numRaw = typeof raw === 'string' ? parseFloat(raw) : raw;
              beerValue =
                Number.isInteger(numRaw * 100) && (numRaw * 10) % 10 === 0
                  ? numRaw.toFixed(1)
                  : numRaw.toFixed(2);
            }
          } else if (f.field === "date_range") {
            const beerDate = new Date(
              beer.first_created_at || beer.recent_created_at || beer.footerInfo?.timestamp
            );
            const startDate = f.selected[0]
              ? DateUtils.startOfDay(f.selected[0])
              : new Date("1900-01-01");
            const endDate = f.selected[1]
              ? DateUtils.endOfDay(f.selected[1])
              : DateUtils.endOfDay(new Date());
            return beerDate >= startDate && beerDate <= endDate;
          }
          return f.selected.includes(beerValue);
        });

        if (!passesOtherFilters) return;

        let value = "";
        if (currentFilter.field === "brewery")
          value = beer.brewery?.brewery_name || beer.breweryName || "";
        else if (currentFilter.field === "beer_style")
          value = beer.beer?.beer_style || beer.subtitle || "";
        else if (currentFilter.field === "country")
          value = beer.brewery?.country_name || beer.country || "";
        else if (currentFilter.field === "region")
          value = beer.brewery?.location?.brewery_state || beer.state || "";
        else if (currentFilter.field === "rating") {
          const raw = beer.rating_score !== undefined ? beer.rating_score : beer.rating;
          if (raw !== undefined && raw !== null) {
            const numRaw = typeof raw === 'string' ? parseFloat(raw) : raw;
            value =
              Number.isInteger(numRaw * 100) && (numRaw * 10) % 10 === 0
                ? numRaw.toFixed(1)
                : numRaw.toFixed(2);
          }
        }

        if (value) countMap[value] = (countMap[value] || 0) + 1;
      });

      currentFilter.options.forEach((option) => {
        if (!countMap[option]) countMap[option] = 0;
      });

      currentFilter.countMap = countMap;
    });
  }

  resetFilters(): void {
    this.filterFields.forEach((f) => {
      if (f.field === "date_range") {
        const today = DateUtils.toISODate(new Date());
        // Reset "From" to today and "To" to the latest available beer date
        f.selected = [today, f.options[1]];
      } else {
        f.selected = [];
      }
    });
    this.searchTerm = "";
    this.applyFilters();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.updatePaginatedBeers();
  }

  changeItemsPerPage(items: number): void {
    this.itemsPerPage = items;
    this.updatePaginatedBeers();
  }

  updatePaginatedBeers(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    const beersToPaginate = this.filteredBeers.slice(startIndex, endIndex);
    this.paginatedBeers = beersToPaginate.map((beer) =>
      this.transformBeerData(beer)
    );
  }

  viewOnMap(beer: any): void {
    const lat = beer.brewery?.location?.lat || beer.extraData?.mapData?.lat;
    const lng = beer.brewery?.location?.lng || beer.extraData?.mapData?.lng;
    const breweryId = beer.brewery?.brewery_id || beer.extraData?.mapData?.breweryId;

    if (lat && lng && breweryId) {
      this.router.navigate(["/map"], { queryParams: { lat, lng, breweryId } });
    } else {
      console.warn("No location data available for this brewery");
    }
  }

  public published(createdAt: string): string {
    return DateUtils.formatDate(createdAt, {
      hour: "numeric",
      minute: "numeric",
      hour12: true,
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }
}
