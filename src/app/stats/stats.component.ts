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
  public filteredBeers: any[] = [];
  public paginatedBeers: any[] = [];
  public currentPage: number = 1;
  public itemsPerPage: number = 10;
  public totalItems: number = 0;
  public searchTerm: string = '';

  public filterFields: FilterField[] = [
    { field: 'brewery', label: 'Brewery', options: [], selected: [] },
    { field: 'beer_style', label: 'Beer Style', options: [], selected: [] }
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

        this.filterFields[0].options = this.getUniqueFieldValues('brewery');
        this.filterFields[1].options = this.getUniqueFieldValues('beer_style');

        this.resetFilters();
      } else {
        console.error('Invalid data structure:', data);
      }
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  private getUniqueFieldValues(field: string): string[] {
    let values: string[] = [];
    if (field === 'brewery') {
      values = this.beers.map(beer => beer.brewery?.brewery_name).filter(Boolean);
    } else if (field === 'beer_style') {
      values = this.beers.map(beer => beer.beer?.beer_style).filter(Boolean);
    }
    return [...new Set(values)];
  }

  onFilterChange(): void {
    this.applyFilters();
    this.updateDropdownOptions();
  }

  private updateDropdownOptions(): void {
    const selectedBreweries = this.filterFields.find(field => field.field === 'brewery')?.selected || [];
    const selectedStyles = this.filterFields.find(field => field.field === 'beer_style')?.selected || [];
  
    const filteredBreweries = new Set<string>();
    const filteredStyles = new Set<string>();
  
    // Ensure brewery list is updated based on selected styles
    this.beers.forEach(beer => {
      const breweryName = beer.brewery?.brewery_name;
      const beerStyle = beer.beer?.beer_style;
  
      if (!breweryName || !beerStyle) return;
  
      if (selectedStyles.length === 0 || selectedStyles.includes(beerStyle)) {
        filteredBreweries.add(breweryName);
      }
      if (selectedBreweries.length === 0 || selectedBreweries.includes(breweryName)) {
        filteredStyles.add(beerStyle);
      }
    });
  
    this.filterFields[0].options = Array.from(filteredBreweries);
    this.filterFields[1].options = Array.from(filteredStyles);
  
    // Ensure selected values are preserved if still valid
    this.filterFields[0].selected = this.filterFields[0].selected.filter(brewery => filteredBreweries.has(brewery));
    this.filterFields[1].selected = this.filterFields[1].selected.filter(style => filteredStyles.has(style));
  }
  
  applyFilters(): void {
    const selectedBreweries = this.filterFields.find(field => field.field === 'brewery')?.selected || [];
    const selectedStyles = this.filterFields.find(field => field.field === 'beer_style')?.selected || [];
    const searchTermLower = this.searchTerm.toLowerCase();
  
    this.filteredBeers = this.beers.filter(beer => {
      const breweryName = beer.brewery?.brewery_name || '';
      const beerStyle = beer.beer?.beer_style || '';
  
      // Only show results that match BOTH selected brewery and style
      const isBreweryMatch = selectedBreweries.length === 0 || selectedBreweries.includes(breweryName);
      const isStyleMatch = selectedStyles.length === 0 || selectedStyles.includes(beerStyle);
      const isSearchMatch = this.searchTerm === '' ||
        beer.beer.beer_name.toLowerCase().includes(searchTermLower) ||
        beerStyle.toLowerCase().includes(searchTermLower) ||
        breweryName.toLowerCase().includes(searchTermLower);
  
      return isBreweryMatch && isStyleMatch && isSearchMatch;
    });
  
    this.totalItems = this.filteredBeers.length;
    this.updatePaginatedBeers();
  }  

  resetFilters(): void {
    this.searchTerm = ''; // Clear search input
  
    // Restore original options
    const allBreweries = this.getUniqueFieldValues('brewery');
    const allStyles = this.getUniqueFieldValues('beer_style');
  
    this.filterFields[0].options = allBreweries;
    this.filterFields[1].options = allStyles;
  
    // Ensure all options are selected
    this.filterFields[0].selected = [...allBreweries];
    this.filterFields[1].selected = [...allStyles];
  
    // Now apply filters to show all beers
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

  public getJSON(): Observable<any> {
    return this.http.get('https://liquid-stats.s3.amazonaws.com/beers.json');
  }

  public published(createAt: string): string {
    return moment(Date.parse(createAt)).format('h:mm A D MMM YYYY');
  }
}
