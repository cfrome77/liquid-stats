import {
  Component,
  AfterViewInit,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
  NgZone,
  ViewChild,
  ElementRef,
  HostListener,
  Inject,
  PLATFORM_ID,
} from "@angular/core";
import { CommonModule, isPlatformBrowser } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { ActivatedRoute } from "@angular/router";
import { MatDividerModule } from "@angular/material/divider";
import { MatSidenav, MatSidenavModule } from "@angular/material/sidenav";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { BreakpointObserver } from "@angular/cdk/layout";
import { Subscription } from "rxjs";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatInputModule } from "@angular/material/input";
import { MarkerService } from "src/app/core/services/marker.service";
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
    MatFormFieldModule,
    MatSelectModule,
    MatInputModule,
  ],
})
export class MapComponent implements OnInit, AfterViewInit, OnDestroy {
  public mapId = "myMap";
  public selectedBrewery: any = null;
  private map: L.Map | undefined;
  private routeSub: Subscription | undefined;

  public filterOpen = false;
  public filterName = "";
  public filterStyle = "";
  public filterCountry = "";
  public filterRating = "";

  public beerStyles: string[] = [];
  public countries: string[] = [];
  private allBeers: BeerCheckin[] = [];
  public isMobile = false;

  @ViewChild("drawer") drawer!: MatSidenav;
  @ViewChild("overlayPanel") overlayPanel?: ElementRef;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private markerService: MarkerService,
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
    private breakpointObserver: BreakpointObserver,
    private route: ActivatedRoute,
    private ngZone: NgZone,
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

    // Initial invalidateSize after DOM rendered
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => this.map?.invalidateSize(), 0);
    });

    // Close overlay when clicking on map
    this.map!.on("click", () => this.closeBreweryOverlay());

    // Listen to drawer open/close to recalc map size
    this.drawer.openedStart.subscribe(() =>
      this.ngZone.runOutsideAngular(() => {
        setTimeout(() => this.map?.invalidateSize(), 0);
      }),
    );
    this.drawer.closedStart.subscribe(() =>
      this.ngZone.runOutsideAngular(() => {
        setTimeout(() => this.map?.invalidateSize(), 0);
      }),
    );

    // Load beer data
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

        this.updateMarkers(this.allBeers);

        // Ensure map resizes after markers added
        this.ngZone.runOutsideAngular(() => {
          setTimeout(() => this.map?.invalidateSize(), 0);
        });

        // Listen for deep links (URL params)
        this.routeSub = this.route.queryParams.subscribe((params) => {
          if (params["lat"] && params["lng"] && params["breweryId"]) {
            this.handleDeepLink(
              parseFloat(params["lat"]),
              parseFloat(params["lng"]),
              params["breweryId"],
            );
          }
        });

        this.cdr.detectChanges();
      },
      error: (err) => console.error("Error fetching map data:", err),
    });
  }

  /** Recalculate map if window resizes */
  @HostListener("window:resize")
  onResize() {
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => this.map?.invalidateSize(), 0);
    });
  }

  ngAfterViewChecked() {
    if (this.overlayPanel)
      L.DomEvent.disableClickPropagation(this.overlayPanel.nativeElement);
  }

  ngOnDestroy(): void {
    if (this.map) this.map.remove();
    this.routeSub?.unsubscribe();
  }

  /** Initialize Leaflet map */
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

  /** Open brewery overlay */
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

  /** Opens a single check-in in a new tab */
  openCheckin(url: string) {
    window.open(url, "_blank");
  }

  /** Close overlay */
  closeBreweryOverlay() {
    this.selectedBrewery = null;
  }

  /** Escape key closes overlay */
  @HostListener("document:keydown.escape")
  handleEscape() {
    this.closeBreweryOverlay();
  }

  /** Update markers */
  private updateMarkers(beers: BeerCheckin[]) {
    if (!this.map) return;

    this.markerService.makeBreweryMarkers(this.map, beers, (markerData) => {
      this.selectedBrewery = {
        breweryId: markerData.breweryId,
        name: markerData.name,
        city: markerData.city,
        state: markerData.state,
        logo: markerData.logo,
        checkIns: markerData.checkIns,
      };
      this.cdr.detectChanges();
    });

    // Update overlay if a brewery is already selected
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

    // After markers added, recalc map size
    this.ngZone.runOutsideAngular(() => {
      setTimeout(() => this.map?.invalidateSize(), 0);
    });
  }

  /** Filter check-ins */
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

  /** Handle deep link from URL */
  private handleDeepLink(lat: number, lng: number, breweryId: string) {
    if (!this.map) return;

    const marker = this.markerService.getMarkerByBreweryId(breweryId);
    if (marker) {
      this.markerService.markers.zoomToShowLayer(marker, () => {
        // Always force zoom level 18 when arriving from history link to pinpoint the brewery
        if (this.map) {
          this.map.setView(marker.getLatLng(), 18, { animate: true });
        }
        this.openBreweryOverlay(breweryId);
        const el = marker.getElement();
        if (el) {
          el.classList.add("marker-pulse");
          this.ngZone.runOutsideAngular(() => {
            setTimeout(() => el.classList.remove("marker-pulse"), 3000);
          });
        }
      });
    } else {
      // Fallback if marker not found
      this.map.setView([lat, lng], 16, { animate: true, duration: 1.5 });
      this.openBreweryOverlay(breweryId);
    }
  }

  /** Apply filters */
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

  /** Reset filters */
  resetFilters() {
    this.filterName = "";
    this.filterStyle = "";
    this.filterCountry = "";
    this.filterRating = "";
    this.applyFilters();
  }
}
