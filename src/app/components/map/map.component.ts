import {
  Component,
  AfterViewInit,
  Inject,
  PLATFORM_ID,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  ViewChild,
  ElementRef,
  HostListener,
} from "@angular/core";
import { CommonModule, isPlatformBrowser } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { MatDividerModule } from "@angular/material/divider";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { BreakpointObserver } from "@angular/cdk/layout";
import {
  MarkerService,
  BreweryMarker,
} from "src/app/core/services/marker.service";
import { DataService } from "src/app/core/services/data.service";
import * as L from "leaflet";
import "leaflet.markercluster";
import { BeerCheckin } from "src/app/core/models/beer.model";

@Component({
  selector: "app-map",
  templateUrl: "./map.component.html",
  styleUrls: ["./map.component.css"],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDividerModule,
    MatSidenavModule,
    MatButtonModule,
    MatIconModule,
  ],
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  public mapId = "myMap";
  public selectedBrewery: any = null;
  private map: L.Map | undefined;

  public filterOpen = false;
  public filterName = "";
  public filterStyle = "";
  public filterCountry = "";
  public filterRating = "";

  public beerStyles: string[] = [];
  public countries: string[] = [];

  private allBeers: BeerCheckin[] = [];
  public isMobile = false;

  @ViewChild("overlayPanel") overlayPanel?: ElementRef;
  @ViewChild("drawerPanel") drawerPanel?: ElementRef;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private markerService: MarkerService,
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    private breakpointObserver: BreakpointObserver,
  ) {}

  ngOnInit() {
    this.breakpointObserver
      .observe(["(max-width: 768px)"])
      .subscribe((result) => {
        this.isMobile = result.matches;
      });
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.initMap();

    // Close overlay on map click
    this.map!.on("click", () => this.closeBreweryOverlay());

    this.dataService.getBeers().subscribe({
      next: (data) => {
        this.allBeers = data?.beers || [];

        // Extract filter options
        this.beerStyles = Array.from(
          new Set(this.allBeers.map((b) => b.beer.beer_style).filter(Boolean)),
        );
        this.countries = Array.from(
          new Set(
            this.allBeers.map((b) => b.brewery.country_name).filter(Boolean),
          ),
        );

        // Create markers and attach click callback
        this.updateMarkers(this.allBeers);

        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error fetching map data:", err),
    });
  }

  ngAfterViewChecked() {
    // Disable map click propagation on overlay/drawer
    if (this.overlayPanel)
      L.DomEvent.disableClickPropagation(this.overlayPanel.nativeElement);
    if (this.drawerPanel)
      L.DomEvent.disableClickPropagation(this.drawerPanel.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.map) this.map.remove();
  }

  private initMap(): void {
    if (this.map) return;

    const iconDefault = L.icon({
      iconUrl: "/assets/images/marker-icon.png",
      shadowUrl: "/assets/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41],
    });
    L.Marker.prototype.options.icon = iconDefault;

    this.map = L.map(this.mapId, {
      center: [39.8282, -98.5795],
      zoom: 3,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 18,
      minZoom: 3,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);
  }

  /** Opens a single check-in in a new tab */
  openCheckin(url: string) {
    window.open(url, "_blank");
  }

  /** Closes the brewery overlay panel */
  closeBreweryOverlay() {
    this.selectedBrewery = null;
  }

  /** Handles escape key to close overlay */
  @HostListener("document:keydown.escape")
  handleEscape() {
    this.closeBreweryOverlay();
  }

  /** Apply filters and update markers */
  applyFilters() {
    if (!this.map || !this.allBeers) return;

    let filtered = this.allBeers;

    if (this.filterName) {
      const nameLower = this.filterName.toLowerCase();
      filtered = filtered.filter((b) =>
        b.brewery.brewery_name.toLowerCase().includes(nameLower),
      );
    }
    if (this.filterStyle)
      filtered = filtered.filter((b) => b.beer.beer_style === this.filterStyle);
    if (this.filterCountry)
      filtered = filtered.filter(
        (b) => b.brewery.country_name === this.filterCountry,
      );
    if (this.filterRating) {
      const ratingNum = Number(this.filterRating);
      filtered = filtered.filter((b) => (b.rating_score ?? 0) >= ratingNum);
    }

    this.updateMarkers(filtered);
  }

  /** Reset all filters */
  resetFilters() {
    this.filterName = "";
    this.filterStyle = "";
    this.filterCountry = "";
    this.filterRating = "";
    this.applyFilters();
  }

  /** Get filtered check-ins for a specific brewery */
  private getFilteredCheckIns(breweryId: string) {
    return this.allBeers
      .filter((b) => b.brewery.brewery_id?.toString() === breweryId)
      .filter((b) => {
        if (this.filterStyle && b.beer.beer_style !== this.filterStyle)
          return false;
        if (this.filterCountry && b.brewery.country_name !== this.filterCountry)
          return false;
        if (
          this.filterRating &&
          (b.rating_score ?? 0) < Number(this.filterRating)
        )
          return false;
        return true;
      })
      .map((b) => ({
        beerName: b.beer.beer_name ?? "Unknown",
        beerLabel:
          b.beer.beer_label ??
          "https://assets.untappd.com/site/assets/images/temp/badge-beer-default.png",
        beerABV: b.beer.beer_abv ?? 0,
        beerStyle: b.beer.beer_style ?? "Unknown",
        rating: b.rating_score ?? 0,
        checkInDate: b.recent_created_at
          ? new Date(b.recent_created_at).toLocaleString()
          : "Unknown Date",
        checkInId: b.recent_checkin_id ?? 0,
      }));
  }

  /** Update markers and overlay after filtering */
  private updateMarkers(beers: BeerCheckin[]) {
    if (!this.map) return;

    // Pass callback so marker click opens overlay with correct check-ins
    this.markerService.makeBreweryMarkers(this.map, beers, (markerData) => {
      this.selectedBrewery = {
        breweryId: markerData.breweryId,
        name: markerData.name,
        city: markerData.city,
        state: markerData.state,
        logo: markerData.logo,
        checkIns: markerData.checkIns, // <-- use the checkIns passed from MarkerService
      };
      this.cdr.detectChanges();
    });

    // If overlay is already open, refresh it with filtered markerData
    if (this.selectedBrewery) {
      const marker = this.markerService.getMarkerByBreweryId(
        this.selectedBrewery.breweryId!,
      );
      if (marker) {
        this.selectedBrewery.checkIns = marker.checkInsData?.checkIns || [];
        this.cdr.detectChanges();
      } else {
        this.selectedBrewery = null;
      }
    }
  }

  /** Open brewery overlay with filtered check-ins */
  openBreweryOverlay(breweryId: string) {
    const marker = this.markerService.getMarkerByBreweryId(breweryId);
    if (!marker) return;

    this.selectedBrewery = {
      breweryId: marker.breweryId,
      name: marker.checkInsData?.name,
      city: marker.checkInsData?.city,
      state: marker.checkInsData?.state,
      logo: marker.checkInsData?.logo,
      checkIns: this.getFilteredCheckIns(marker.breweryId!),
    };
    this.cdr.detectChanges();
  }
}
