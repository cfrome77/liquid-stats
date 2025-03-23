import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as moment from 'moment';

interface FilterField {
  field: string;
  label: string;
  options: string[];
  selected: string[];
}

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnInit {
  public beers: any[] = [];
  public paginatedBeers: any[] = [];
  public currentPage: number = 1;
  public itemsPerPage: number = 10;
  public totalItems: number = 0;

  public filterFields: FilterField[] = [
    { field: 'brewery', label: 'Brewery', options: [], selected: [] },
    { field: 'beer_style', label: 'Beer Style', options: [], selected: [] }
  ];

  public filteredBeers: any[] = [];
  public searchTerm: string = ''; // This will hold the search term

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.fetchBeersData();
  }

  // Fetch beer data from JSON
  public fetchBeersData(): void {
    this.getJSON().subscribe((data) => {
      if (data && data.beers && Array.isArray(data.beers)) {
        this.beers = data.beers;
        this.totalItems = this.beers.length;
        this.filteredBeers = this.beers;

        // Extract unique values for breweries and beer styles
        this.filterFields[0].options = this.getUniqueFieldValues('brewery');
        this.filterFields[1].options = this.getUniqueFieldValues('beer_style');

        // Set selected to all options by default
        this.filterFields[0].selected = [...this.filterFields[0].options];
        this.filterFields[1].selected = [...this.filterFields[1].options];

        // Apply any initial filters
        this.applyFilters();
      } else {
        console.error('Invalid data structure:', data);
      }
    });
  }

  onSearchChange(): void {
    this.filteredBeers = this.beers.filter(beer => {
      const searchTermLower = this.searchTerm.toLowerCase();
      return beer.beer.beer_name.toLowerCase().includes(searchTermLower) ||
        beer.beer.beer_style.toLowerCase().includes(searchTermLower) ||
        beer.brewery?.brewery_name.toLowerCase().includes(searchTermLower);
    });
    this.totalItems = this.filteredBeers.length;
    this.updatePaginatedBeers();
  }

  // Retrieve the JSON data
  public getJSON(): Observable<any> {
    return this.http.get('https://liquid-stats.s3.amazonaws.com/beers.json');
  }

  // Format the date for display
  public published(createAt: string): string {
    return moment(Date.parse(createAt)).format('h:mm A D MMM YYYY');
  }

  // Get unique values for a given field (brewery or beer_style)
  private getUniqueFieldValues(field: string): string[] {
    let values: string[] = [];
    if (field === 'brewery') {
      values = this.beers.map(beer => beer.brewery?.brewery_name).filter(Boolean);
    } else if (field === 'beer_style') {
      values = this.beers.map(beer => beer.beer?.beer_style).filter(Boolean);
    }
    return [...new Set(values)];
  }

  // Update options for Beer Style based on selected Brewery
  updateBeerStyleOptions(): void {
    const selectedBreweries = this.filterFields.find(field => field.field === 'brewery')?.selected || [];
    const stylesForSelectedBreweries = new Set<string>();

    if (selectedBreweries.length > 0) {
      this.beers.forEach(beer => {
        if (selectedBreweries.includes(beer.brewery?.brewery_name)) {
          stylesForSelectedBreweries.add(beer.beer?.beer_style);
        }
      });
    } else {
      // If no brewery is selected, show all styles
      this.filterFields[1].options = this.getUniqueFieldValues('beer_style');
      return;
    }

    this.filterFields[1].options = Array.from(stylesForSelectedBreweries);
  }

  // Update options for Brewery based on selected Beer Style
  updateBreweryOptions(): void {
    const selectedStyles = this.filterFields.find(field => field.field === 'beer_style')?.selected || [];
    const breweriesForSelectedStyles = new Set<string>();

    if (selectedStyles.length > 0) {
      this.beers.forEach(beer => {
        if (selectedStyles.includes(beer.beer?.beer_style)) {
          breweriesForSelectedStyles.add(beer.brewery?.brewery_name);
        }
      });
    } else {
      // If no style is selected, show all breweries
      this.filterFields[0].options = this.getUniqueFieldValues('brewery');
      return;
    }

    this.filterFields[0].options = Array.from(breweriesForSelectedStyles);
  }

  // Apply the selected filters to the beers data
  applyFilters(): void {
    this.filteredBeers = this.beers.filter(beer => {
      const breweryFilterSelected = this.filterFields.find(field => field.field === 'brewery')?.selected || [];
      const styleFilterSelected = this.filterFields.find(field => field.field === 'beer_style')?.selected || [];

      const isBreweryMatch = breweryFilterSelected.length === 0 || breweryFilterSelected.includes(beer.brewery?.brewery_name || '');
      const isStyleMatch = styleFilterSelected.length === 0 || styleFilterSelected.includes(beer.beer?.beer_style || '');

      return isBreweryMatch && isStyleMatch;
    });

    this.totalItems = this.filteredBeers.length;
    this.updatePaginatedBeers();
  }

  // Update paginated beers based on current filters
  updatePaginatedBeers(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedBeers = this.filteredBeers.slice(startIndex, endIndex);
  }

  // Handle page navigation
  goToPage(page: number): void {
    this.currentPage = page;
    this.updatePaginatedBeers();
  }

  // Handle items per page change
  changeItemsPerPage(itemsPerPage: number): void {
    const maxPage = Math.ceil(this.totalItems / itemsPerPage);
    if (this.currentPage > maxPage) {
      this.currentPage = maxPage;
    }
    this.itemsPerPage = itemsPerPage;
    this.updatePaginatedBeers();
  }
}