import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { BaseCardData } from '../../shared/components/card/card-data.interface';
import { environment } from '../../../environments/environment';
import { DateUtils } from 'src/app/shared/date-utils';

interface FilterField {
  field: string;
  label: string;
  options: string[];
  selected: string[];
  countMap?: { [option: string]: number };
  type?: 'text' | 'date' | 'number';
}

@Component({
  selector: 'app-beer-history',
  templateUrl: './beer-history.component.html',
  styleUrls: ['./beer-history.component.css']
})
export class BeerHistoryComponent implements OnInit {
  public beers: any[] = [];
  public filteredBeers: any[] = [];
  public paginatedBeers: BaseCardData[] = [];
  public currentPage: number = 1;
  public itemsPerPage: number = 10;
  public totalItems: number = 0;
  public searchTerm: string = '';
  username: string;

  public filterFields: FilterField[] = [
    { field: 'brewery', label: 'Brewery', options: [], selected: [], countMap: {} },
    { field: 'beer_style', label: 'Beer Style', options: [], selected: [], countMap: {} },
    { field: 'country', label: 'Country', options: [], selected: [], countMap: {} },
    { field: 'region', label: 'State/Region', options: [], selected: [], countMap: {} },
    { field: 'rating', label: 'Ratings', options: [], selected: [], countMap: {} },
    { field: 'date_range', label: 'Date Range', options: [], selected: [], type: 'date' },
  ];

  constructor(private http: HttpClient, private router: Router) {
    this.username = environment.untappdUsername;
  }

  ngOnInit(): void {
    this.fetchBeersData();
  }

  private fetchBeersData(): void {
    this.getJSON().subscribe((data) => {
      if (data && data.beers && Array.isArray(data.beers)) {
        const parseDate = (dateStr: string): Date => {
          const d = new Date(dateStr);
          return isNaN(d.getTime()) ? new Date() : d;
        };

        // Separate invalid ones
        const validBeers = data.beers.filter((b: { first_created_at: string; }) => !isNaN(parseDate(b.first_created_at).getTime()));

        // Sort valid beers by date
        this.beers = validBeers.sort(
          (a: { first_created_at: string; }, b: { first_created_at: string; }) => parseDate(b.first_created_at).getTime() - parseDate(a.first_created_at).getTime()
        );

        // Build timestamps
       const timestamps = this.beers.map(b => DateUtils.parseDate(b.first_created_at));

        this.filteredBeers = [...this.beers];
        this.totalItems = this.beers.length;

        const minDate = DateUtils.toISODate(DateUtils.minDate(timestamps));
        const maxDate = DateUtils.toISODate(DateUtils.maxDate(timestamps));

        const dateFilter = this.filterFields.find(f => f.field === 'date_range');
        if (dateFilter) {
          dateFilter.options = [minDate, maxDate];
          dateFilter.selected = [minDate, maxDate];
        }

        // Build ratings list
        const quarterPointScale = Array.from({ length: 21 }, (_, i) => (i * 0.25).toFixed(2));
        const tenthPointScale = Array.from({ length: 51 }, (_, i) => (i * 0.1).toFixed(1));
        const combinedRatings = Array.from(new Set([
          ...quarterPointScale.map(val => parseFloat(val)),
          ...tenthPointScale.map(val => parseFloat(val))
        ])).sort((a, b) => a - b);

        const formattedRatings = combinedRatings.map(rating =>
          Number.isInteger(rating * 100) && rating * 10 % 10 === 0
            ? rating.toFixed(1)
            : rating.toFixed(2)
        );

        this.filterFields[0].options = this.getUniqueFieldValues('brewery').sort();
        this.filterFields[1].options = this.getUniqueFieldValues('beer_style').sort();
        this.filterFields[2].options = this.getUniqueFieldValues('country').sort();
        this.filterFields[3].options = this.getUniqueFieldValues('region').sort();
        this.filterFields[4].options = formattedRatings;

        this.updateOptionCounts();
        this.resetFilters();
      }
    });
  }

  // Transform beer data to BaseCardData format
  public transformBeerData(beer: any): BaseCardData {
    return {
      title: beer.beer.beer_name,
      subtitle: beer.beer.beer_style,
      breweryName: beer.brewery?.brewery_name,
      description: beer.beer.beer_description,
      rating: beer.rating_score,
      globalRating: beer.beer.rating_score,
      mainImage: beer.beer.beer_label,
      secondaryImage: beer.brewery?.brewery_label,
      footerInfo: {
        text: 'View Details',
        link: `https://untappd.com/b/${beer.beer.beer_slug}/${beer.beer.bid}`,
        timestamp: this.published(beer.recent_created_at)
      },
      extraData: {
        socialLinks: beer.brewery.contact,
        mapData: {
          lat: beer.brewery?.location?.lat,
          lng: beer.brewery?.location?.lng,
          breweryId: beer.brewery?.brewery_id
        },
        venueId: beer.brewery?.brewery_id,
        checkinId: beer.recent_checkin_id,
        userName: this.username
      }
    };
  }

  public getJSON(): Observable<any> {
    return this.http.get('https://liquid-stats.s3.amazonaws.com/beers.json');
  }

  private getUniqueFieldValues(field: string): string[] {
    let values: string[] = [];

    if (field === 'brewery') {
      values = this.beers.map(beer => beer.brewery?.brewery_name).filter(Boolean);
    } else if (field === 'beer_style') {
      values = this.beers.map(beer => beer.beer?.beer_style).filter(Boolean);
    } else if (field === 'country') {
      values = this.beers.map(beer => beer.brewery?.country_name).filter(Boolean);
    } else if (field === 'region') {
      values = this.beers.map(beer => beer.brewery?.location?.brewery_state).filter(Boolean);
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
    const selectedBreweries = this.filterFields.find(f => f.field === 'brewery')?.selected || [];
    const selectedStyles = this.filterFields.find(f => f.field === 'beer_style')?.selected || [];
    const selectedCountries = this.filterFields.find(f => f.field === 'country')?.selected || [];
    const selectedRegions = this.filterFields.find(f => f.field === 'region')?.selected || [];
    const selectedRatings = this.filterFields.find(f => f.field === 'rating')?.selected.map(r => parseFloat(r)) || [];
    const dateRange = this.filterFields.find(f => f.field === 'date_range')?.selected || [];
    const searchTermLower = this.searchTerm.toLowerCase();

    const startDate = dateRange[0] ? DateUtils.startOfDay(dateRange[0]) : new Date('1900-01-01');
    const endDate = dateRange[1] ? DateUtils.endOfDay(dateRange[1]) : DateUtils.endOfDay(new Date());

    this.filteredBeers = this.beers.filter(beer => {
      const brewery = beer.brewery?.brewery_name || '';
      const style = beer.beer?.beer_style || '';
      const country = beer.brewery?.country_name || '';
      const region = beer.brewery?.location?.brewery_state || '';
      const rating = beer.rating_score || 0;
      const beerDate = new Date(beer.first_created_at);

      const matchBrewery = selectedBreweries.length === 0 || selectedBreweries.includes(brewery);
      const matchStyle = selectedStyles.length === 0 || selectedStyles.includes(style);
      const matchCountry = selectedCountries.length === 0 || selectedCountries.includes(country);
      const matchRegion = selectedRegions.length === 0 || selectedRegions.includes(region);
      const matchRating = selectedRatings.length === 0 || selectedRatings.includes(rating);
      const matchDate = beerDate >= startDate && beerDate <= endDate;

      const matchSearch =
        this.searchTerm === '' ||
        beer.beer.beer_name.toLowerCase().includes(searchTermLower) ||
        style.toLowerCase().includes(searchTermLower) ||
        brewery.toLowerCase().includes(searchTermLower) ||
        country.toLowerCase().includes(searchTermLower) ||
        region.toLowerCase().includes(searchTermLower) ||
        (beer.beer.beer_description?.toLowerCase().includes(searchTermLower) ?? false);

      return matchBrewery && matchStyle && matchCountry && matchRegion && matchRating && matchDate && matchSearch;
    });

    this.totalItems = this.filteredBeers.length;
    this.updateOptionCounts();
    this.updatePaginatedBeers();
  }

  updateOptionCounts(): void {
    this.filterFields.forEach(currentFilter => {
      const countMap: { [option: string]: number } = {};

      this.beers.forEach(beer => {
        // Check if beer passes all OTHER filters
        const passesOtherFilters = this.filterFields.every(f => {
          if (f === currentFilter) return true; // skip self
          if (!f.selected.length) return true;

          let beerValue = '';
          if (f.field === 'brewery') beerValue = beer.brewery?.brewery_name || '';
          else if (f.field === 'beer_style') beerValue = beer.beer?.beer_style || '';
          else if (f.field === 'country') beerValue = beer.brewery?.country_name || '';
          else if (f.field === 'region') beerValue = beer.brewery?.location?.brewery_state || '';
          else if (f.field === 'rating') {
            const raw = beer.rating_score;
            if (raw !== undefined && raw !== null) {
              beerValue = (Number.isInteger(raw * 100) && raw * 10 % 10 === 0)
                ? raw.toFixed(1)
                : raw.toFixed(2);
            }
          }
          return f.selected.includes(beerValue);
        });

        if (!passesOtherFilters) return;

        // Now count this beer for current filter
        let value = '';
        if (currentFilter.field === 'brewery') value = beer.brewery?.brewery_name || '';
        else if (currentFilter.field === 'beer_style') value = beer.beer?.beer_style || '';
        else if (currentFilter.field === 'country') value = beer.brewery?.country_name || '';
        else if (currentFilter.field === 'region') value = beer.brewery?.location?.brewery_state || '';
        else if (currentFilter.field === 'rating') {
          const raw = beer.rating_score;
          if (raw !== undefined && raw !== null) {
            value = (Number.isInteger(raw * 100) && raw * 10 % 10 === 0)
              ? raw.toFixed(1)
              : raw.toFixed(2);
          }
        }

        if (value) {
          countMap[value] = (countMap[value] || 0) + 1;
        }
      });

      // Ensure every option has at least a 0
      currentFilter.options.forEach(option => {
        if (!countMap[option]) {
          countMap[option] = 0;
        }
      });

      currentFilter.countMap = countMap;
    });
  }

  resetFilters(): void {
    this.filterFields.forEach(f => f.selected = []);
    this.searchTerm = '';
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
    this.paginatedBeers = beersToPaginate.map(beer => this.transformBeerData(beer));
  }

  viewOnMap(beer: any): void {
    const lat = beer.brewery?.location?.lat;
    const lng = beer.brewery?.location?.lng;
    const breweryId = beer.brewery?.brewery_id;

    if (lat && lng && breweryId) {
      this.router.navigate(['/map'], {
        queryParams: { lat, lng, breweryId }
      });
    } else {
      console.warn('No location data available for this brewery');
    }
  }

  public published(createdAt: string): string {
    return DateUtils.formatDate(createdAt, {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true,
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }
}
