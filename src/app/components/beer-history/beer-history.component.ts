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
  public beers: (BeerCheckin | BaseCardData)[] = [];
  public filteredBeers: (BeerCheckin | BaseCardData)[] = [];
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
        let beersArray: (BeerCheckin | BaseCardData)[] = [];
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

          this.beers = beersArray.sort((a: any, b: any) => {
            const dateA = parseDate(
              a.first_created_at || a.recent_created_at || a.footerInfo?.timestamp
            );
            const dateB = parseDate(
              b.first_created_at || b.recent_created_at || b.footerInfo?.timestamp
            );
            return dateB.getTime() - dateA.getTime();
          });

          const timestamps = this.beers.map((b: any) =>
            parseDate(
              b.first_created_at || b.recent_created_at || b.footerInfo?.timestamp
            )
          );

          this.filteredBeers = [...this.beers];
          this.totalItems = this.beers.length;

          // setup date range filter
          const todayDate = new Date();
          const minDate = DateUtils.toISODate(DateUtils.minDate(timestamps));
          const maxDate = DateUtils.toISODate(DateUtils.maxDate(timestamps));
          const today = DateUtils.toISODate(todayDate);
          const dateFilter = this.filterFields.find(
            (f) => f.field === "date_range"
          );
          if (dateFilter) {
            dateFilter.options = [minDate, maxDate];
            // Initial selected range: show all data by default
            dateFilter.selected = [minDate, maxDate];
          }

          // setup ratings
          const existingRatings = this.beers
            .map((b: any) =>
              b.rating_score !== undefined ? b.rating_score : b.rating
            )
            .filter((r) => r !== undefined && r !== null);

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
              ...existingRatings.map((val) =>
                typeof val === "string" ? parseFloat(val) : val
              ),
            ])
          ).sort((a, b) => a - b);
          const formattedRatings = combinedRatings.map((rating) =>
            (rating * 10) % 1 === 0 ? rating.toFixed(1) : rating.toFixed(2)
          );

          const setOptions = (field: string, options: string[]) => {
            const f = this.filterFields.find((f) => f.field === field);
            if (f) f.options = options;
          };

          setOptions("brewery", this.getUniqueFieldValues("brewery").sort());
          setOptions(
            "beer_style",
            this.getUniqueFieldValues("beer_style").sort()
          );
          setOptions("country", this.getUniqueFieldValues("country").sort());
          setOptions("region", this.getUniqueFieldValues("region").sort());
          setOptions("rating", formattedRatings);

          // Initialize selected options with all options by default
          this.filterFields.forEach((f) => {
            if (f.type !== "date") {
              f.selected = [...f.options];
            }
          });

          this.updateOptionCounts();
          this.applyFilters();
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
  public transformBeerData(beer: BeerCheckin | BaseCardData): BaseCardData {
    if ("title" in beer && "subtitle" in beer) {
      return beer as BaseCardData;
    }
    const b = beer as BeerCheckin;
    return {
      title: b.beer?.beer_name || "Unknown Beer",
      subtitle: b.beer?.beer_style || "Unknown Style",
      breweryName: b.brewery?.brewery_name || "Unknown Brewery",
      description: b.beer?.beer_description || "",
      rating: b.rating_score || 0,
      globalRating: b.beer?.rating_score,
      mainImage: b.beer?.beer_label,
      secondaryImage: b.brewery?.brewery_label,
      footerInfo: {
        text: "View Details",
        link: b.beer
          ? `https://untappd.com/b/${b.beer.beer_slug}/${b.beer.bid}`
          : "",
        timestamp: this.published(
          b.recent_created_at || b.first_created_at || ""
        ),
      },
      extraData: {
        socialLinks: b.brewery?.contact,
        mapData: {
          lat: b.brewery?.location?.lat,
          lng: b.brewery?.location?.lng,
          breweryId: b.brewery?.brewery_id,
        },
        venueId: b.brewery?.brewery_id,
        checkinId: b.recent_checkin_id,
        userName: this.username,
      },
    };
  }

  private getUniqueFieldValues(field: string): string[] {
    let values: string[] = [];

    if (field === "brewery") {
      values = this.beers
        .map((beer: any) => beer.brewery?.brewery_name || beer.breweryName)
        .filter(Boolean) as string[];
    } else if (field === "beer_style") {
      values = this.beers
        .map((beer: any) => beer.beer?.beer_style || beer.subtitle)
        .filter(Boolean) as string[];
    } else if (field === "country") {
      values = this.beers
        .map((beer: any) => beer.brewery?.country_name || beer.country)
        .filter(Boolean) as string[];
    } else if (field === "region") {
      values = this.beers
        .map((beer: any) => beer.brewery?.location?.brewery_state || beer.state)
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
      this.filterFields.find((f) => f.field === "rating")?.selected || [];
    const dateRange =
      this.filterFields.find((f) => f.field === "date_range")?.selected || [];
    const searchTermLower = this.searchTerm.toLowerCase();

    const startDate = dateRange[0]
      ? DateUtils.startOfDay(dateRange[0])
      : new Date("1900-01-01");
    const endDate = dateRange[1]
      ? DateUtils.endOfDay(dateRange[1])
      : DateUtils.endOfDay(new Date());

    this.filteredBeers = this.beers.filter((beer: any) => {
      const brewery = beer.brewery?.brewery_name || beer.breweryName || "";
      const style = beer.beer?.beer_style || beer.subtitle || "";
      const country = beer.brewery?.country_name || beer.country || "";
      const region =
        beer.brewery?.location?.brewery_state || beer.state || "";
      const rawRating =
        beer.rating_score !== undefined ? beer.rating_score : beer.rating || 0;
      const ratingStr =
        (rawRating * 10) % 1 === 0 ? rawRating.toFixed(1) : rawRating.toFixed(2);
      const beerDate = DateUtils.parseDate(
        beer.first_created_at ||
          beer.recent_created_at ||
          beer.footerInfo?.timestamp
      );

      const isAllBreweries =
        selectedBreweries.length ===
        this.filterFields.find((f) => f.field === "brewery")?.options.length;
      const isAllStyles =
        selectedStyles.length ===
        this.filterFields.find((f) => f.field === "beer_style")?.options.length;
      const isAllCountries =
        selectedCountries.length ===
        this.filterFields.find((f) => f.field === "country")?.options.length;
      const isAllRegions =
        selectedRegions.length ===
        this.filterFields.find((f) => f.field === "region")?.options.length;
      const isAllRatings =
        selectedRatings.length ===
        this.filterFields.find((f) => f.field === "rating")?.options.length;

      const matchBrewery =
        selectedBreweries.includes(brewery) || (brewery === "" && isAllBreweries);
      const matchStyle =
        selectedStyles.includes(style) || (style === "" && isAllStyles);
      const matchCountry =
        selectedCountries.includes(country) || (country === "" && isAllCountries);
      const matchRegion =
        selectedRegions.includes(region) || (region === "" && isAllRegions);
      const matchRating =
        selectedRatings.includes(ratingStr) || (ratingStr === "0.0" && isAllRatings);
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
    const searchTermLower = this.searchTerm.toLowerCase();
    this.filterFields.forEach((currentFilter) => {
      const countMap: { [option: string]: number } = {};

      this.beers.forEach((beer: any) => {
        // Search term check
        const beerName = beer.beer?.beer_name || beer.title || "";
        const style = beer.beer?.beer_style || beer.subtitle || "";
        const brewery = beer.brewery?.brewery_name || beer.breweryName || "";
        const country = beer.brewery?.country_name || beer.country || "";
        const region = beer.brewery?.location?.brewery_state || beer.state || "";
        const beerDesc = beer.beer?.beer_description || beer.description || "";

        const matchSearch =
          this.searchTerm === "" ||
          beerName.toLowerCase().includes(searchTermLower) ||
          style.toLowerCase().includes(searchTermLower) ||
          brewery.toLowerCase().includes(searchTermLower) ||
          country.toLowerCase().includes(searchTermLower) ||
          region.toLowerCase().includes(searchTermLower) ||
          beerDesc.toLowerCase().includes(searchTermLower);

        if (!matchSearch) return;

        const passesOtherFilters = this.filterFields.every((f) => {
          if (f === currentFilter) return true;

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
                (numRaw * 10) % 1 === 0 ? numRaw.toFixed(1) : numRaw.toFixed(2);
            }
          } else if (f.field === "date_range") {
            const beerDate = DateUtils.parseDate(
              beer.first_created_at ||
                beer.recent_created_at ||
                beer.footerInfo?.timestamp
            );
            const startDate = f.selected[0]
              ? DateUtils.startOfDay(f.selected[0])
              : new Date("1900-01-01");
            const endDate = f.selected[1]
              ? DateUtils.endOfDay(f.selected[1])
              : DateUtils.endOfDay(new Date());
            return beerDate >= startDate && beerDate <= endDate;
          }
          const isAllSelected = f.selected.length === f.options.length;
          return (
            f.selected.includes(beerValue) || (beerValue === "" && isAllSelected)
          );
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
              (numRaw * 10) % 1 === 0 ? numRaw.toFixed(1) : numRaw.toFixed(2);
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
        // Reset to full range
        f.selected = [f.options[0], f.options[1]];
      } else {
        f.selected = [...f.options];
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

  viewOnMap(beer: BeerCheckin | BaseCardData): void {
    const b = beer as any;
    const lat = b.brewery?.location?.lat || b.extraData?.mapData?.lat;
    const lng = b.brewery?.location?.lng || b.extraData?.mapData?.lng;
    const breweryId = b.brewery?.brewery_id || b.extraData?.mapData?.breweryId;

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
