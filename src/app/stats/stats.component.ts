import { Component, OnInit, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as moment from 'moment';
import * as L from 'leaflet';  // Import Leaflet for map functionality

interface FilterField {
  field: string;
  label: string;
  options: string[];
  selected: string[];
}

const iconUrl = 'assets/images/marker-icon.png';  // Path to the icon image
const iconRetinaUrl = 'assets/images/marker-icon-2x.png';  // Retina icon
const shadowUrl = 'assets/images/marker-shadow.png';  // Path to the shadow image

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnInit, AfterViewInit {
  @ViewChild('statsMap', { static: false }) mapContainer!: ElementRef;  // Reference to the map container

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
  public searchTerm: string = '';

  public mapId: string = 'statsMap';

  private map: any;
  private markerIcon = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41]
    });

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.fetchBeersData();
  }

  ngAfterViewInit(): void {
    // Wait for the next tick to make sure the DOM is fully ready
    setTimeout(() => {
      const mapContainer = document.getElementById(this.mapId);
      if (mapContainer) {
        this.initMap();  // Initialize map only when the container is available
      } else {
        console.error('Map container not found!');
      }
    });
  }

  // Fetch beer data from JSON
  public fetchBeersData(): void {
    this.getJSON().subscribe((data) => {
      if (data && data.beers && Array.isArray(data.beers)) {
        this.beers = data.beers;
        this.totalItems = this.beers.length;
        this.filteredBeers = this.beers;

        this.filterFields[0].options = this.getUniqueFieldValues('brewery');
        this.filterFields[1].options = this.getUniqueFieldValues('beer_style');

        this.filterFields[0].selected = [...this.filterFields[0].options];
        this.filterFields[1].selected = [...this.filterFields[1].options];

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

  public getJSON(): Observable<any> {
    return this.http.get('https://liquid-stats.s3.amazonaws.com/beers.json');
  }

  public published(createAt: string): string {
    return moment(Date.parse(createAt)).format('h:mm A D MMM YYYY');
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
      this.filterFields[1].options = this.getUniqueFieldValues('beer_style');
      return;
    }

    this.filterFields[1].options = Array.from(stylesForSelectedBreweries);
  }

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
      this.filterFields[0].options = this.getUniqueFieldValues('brewery');
      return;
    }

    this.filterFields[0].options = Array.from(breweriesForSelectedStyles);
  }

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

  updatePaginatedBeers(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    this.paginatedBeers = this.filteredBeers.slice(startIndex, endIndex);
    this.updateMapMarkers();
  }

  // Update map markers for the paginated beers
  updateMapMarkers(): void {
    if (this.map) {
      // Remove any existing markers
      this.map.eachLayer((layer: any) => {
        if (layer instanceof L.Marker) {
          this.map.removeLayer(layer);
        }
      });
  
      // Add markers using the markerIcon if data is available
      this.paginatedBeers.forEach((beer) => {
        const { lat, lng } = beer.brewery?.location || {};
        if (lat && lng) {
          L.marker([lat, lng], { icon: this.markerIcon })  // Use the custom markerIcon
            .addTo(this.map)
            .bindPopup(`<b>${beer.beer.beer_name}</b><br>${beer.brewery?.brewery_name}`);
        } else {
          console.warn(`Missing coordinates for beer: ${beer.beer.beer_name}`);
        }
      });
    } else {
      console.warn('Map is not initialized yet.');
    }
  }

  initMap(): void {
    const mapContainer = document.getElementById(this.mapId);
    if (!mapContainer) {
      console.error('Map container not found!');
      return;
    }

    this.map = L.map(mapContainer, {
      center: [39.8282, -98.5795],  // Default center (US)
      zoom: 3,  // Default zoom level
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);

    // Add initial markers for the first page of beers
    this.updateMapMarkers();
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.updatePaginatedBeers();
  }

  changeItemsPerPage(itemsPerPage: number): void {
    const maxPage = Math.ceil(this.totalItems / itemsPerPage);
    if (this.currentPage > maxPage) {
      this.currentPage = maxPage;
    }
    this.itemsPerPage = itemsPerPage;
    this.updatePaginatedBeers();
  }
}