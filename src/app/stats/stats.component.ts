import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as moment from 'moment';

interface FilterField {
  field: string;
  label: string;
  options: string[];
  selected: string[];
  countMap?: { [option: string]: number };
}

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnInit {
  public beers: any[] = [];
  public filteredBeers: any[] = [];
  public paginatedBeers: any[] = [];
  public currentPage: number = 1;
  public itemsPerPage: number = 10;
  public totalItems: number = 0;
  public searchTerm: string = '';

  public filterFields: FilterField[] = [
    { field: 'brewery', label: 'Brewery', options: [], selected: [], countMap: {} },
    { field: 'beer_style', label: 'Beer Style', options: [], selected: [], countMap: {} },
    { field: 'country', label: 'Country', options: [], selected: [], countMap: {} },
    { field: 'rating', label: 'Ratings', options: [], selected: [], countMap: {} }
  ];

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.fetchBeersData();
  }

  private fetchBeersData(): void {
    this.getJSON().subscribe((data) => {
      if (data && data.beers && Array.isArray(data.beers)) {
        this.beers = data.beers;
        this.filteredBeers = [...this.beers];
        this.totalItems = this.beers.length;

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

        this.filterFields[0].options = this.getUniqueFieldValues('brewery');
        this.filterFields[1].options = this.getUniqueFieldValues('beer_style');
        this.filterFields[2].options = this.getUniqueFieldValues('country');
        this.filterFields[3].options = formattedRatings;

        this.updateOptionCounts(formattedRatings);
        this.resetFilters();
      } else {
        console.error('Invalid data structure:', data);
      }
    });
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
    }

    return [...new Set(values)];
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onFilterChange(): void {
    this.applyFilters();
    // Removed updateDropdownOptions()
  }

  public applyFilters(): void {
    const selectedBreweries = this.filterFields.find(f => f.field === 'brewery')?.selected || [];
    const selectedStyles = this.filterFields.find(f => f.field === 'beer_style')?.selected || [];
    const selectedCountries = this.filterFields.find(f => f.field === 'country')?.selected || [];
    const selectedRatings = this.filterFields.find(f => f.field === 'rating')?.selected.map(r => parseFloat(r)) || [];

    const searchTermLower = this.searchTerm.toLowerCase();

    this.filteredBeers = this.beers.filter(beer => {
      const brewery = beer.brewery?.brewery_name || '';
      const style = beer.beer?.beer_style || '';
      const country = beer.brewery?.country_name || '';
      const rating = beer.rating_score || 0;

      const matchBrewery = selectedBreweries.length === 0 || selectedBreweries.includes(brewery);
      const matchStyle = selectedStyles.length === 0 || selectedStyles.includes(style);
      const matchCountry = selectedCountries.length === 0 || selectedCountries.includes(country);
      const matchRating = selectedRatings.length === 0 || selectedRatings.includes(rating);

      const matchSearch =
        this.searchTerm === '' ||
        beer.beer.beer_name.toLowerCase().includes(searchTermLower) ||
        style.toLowerCase().includes(searchTermLower) ||
        brewery.toLowerCase().includes(searchTermLower);

      return matchBrewery && matchStyle && matchCountry && matchRating && matchSearch;
    });

    this.totalItems = this.filteredBeers.length;
    this.updatePaginatedBeers();
  }

  updateOptionCounts(ratingsList: string[]): void {
    this.filterFields.forEach(filter => {
      const countMap: { [option: string]: number } = {};

      this.beers.forEach(beer => {
        let value = '';
        if (filter.field === 'brewery') value = beer.brewery?.brewery_name;
        else if (filter.field === 'beer_style') value = beer.beer?.beer_style;
        else if (filter.field === 'country') value = beer.brewery?.country_name;
        else if (filter.field === 'rating') {
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

      ratingsList.forEach(rating => {
        if (!countMap[rating]) {
          countMap[rating] = 0;
        }
      });

      filter.countMap = countMap;
    });
  }

  resetFilters(): void {
    this.searchTerm = '';

    const allBreweries = this.getUniqueFieldValues('brewery');
    const allStyles = this.getUniqueFieldValues('beer_style');

    this.filterFields[0].options = allBreweries;
    this.filterFields[1].options = allStyles;

    this.filterFields[0].selected = [...allBreweries];
    this.filterFields[1].selected = [...allStyles];
    this.filterFields[2].selected = [];
    this.filterFields[3].selected = [];

    setTimeout(() => this.applyFilters(), 0);
  }

  updatePaginatedBeers(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedBeers = this.filteredBeers.slice(startIndex, endIndex);
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.updatePaginatedBeers();
  }

  changeItemsPerPage(itemsPerPage: number): void {
    this.itemsPerPage = itemsPerPage;
    this.updatePaginatedBeers();
  }

  public published(createdAt: string): string {
    return moment(Date.parse(createdAt)).format('h:mm A D MMM YYYY');
  }
}
