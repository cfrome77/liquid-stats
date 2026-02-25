import {
  Component,
  AfterViewInit,
  OnDestroy,
  Inject,
  PLATFORM_ID,
} from "@angular/core";
import { isPlatformBrowser, CommonModule } from "@angular/common";
import { MarkerService } from "src/app/core/services/marker.service";
import { DataService } from "src/app/core/services/data.service";
import { ActivatedRoute } from "@angular/router";
import * as L from "leaflet";
import "leaflet.markercluster";

const iconRetinaUrl = "/assets/images/marker-icon-2x.png";
const iconUrl = "/assets/images/marker-icon.png";
const shadowUrl = "/assets/images/marker-shadow.png";

@Component({
  selector: "app-map",
  templateUrl: "./map.component.html",
  styleUrls: ["./map.component.css"],
  standalone: true,
  imports: [CommonModule],
})
export class MapComponent implements AfterViewInit, OnDestroy {
  public mapId = "myMap";
  private map!: L.Map;
  private markerIcon: L.Icon;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private markerService: MarkerService,
    private dataService: DataService,
    private route: ActivatedRoute,
  ) {
    // Leaflet marker icon setup
    this.markerIcon = L.icon({
      iconRetinaUrl,
      iconUrl,
      shadowUrl,
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      tooltipAnchor: [16, -28],
      shadowSize: [41, 41],
    });
    L.Marker.prototype.options.icon = this.markerIcon;
  }

  ngAfterViewInit(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    // Delay init to allow Angular Material layout
    setTimeout(() => {
      this.initMap();
      this.setMapHeight();

      window.addEventListener("resize", this.setMapHeight.bind(this));

      this.loadMarkers();

      // Optional: center map from query params
      this.route.queryParams.subscribe((params) => {
        const lat = parseFloat(params["lat"]);
        const lng = parseFloat(params["lng"]);
        const breweryId = params["breweryId"];
        if (!isNaN(lat) && !isNaN(lng)) {
          if (breweryId) {
            const marker = this.markerService.getMarkerByBreweryId(breweryId);
            if (marker) {
              this.smoothZoomToMarker(marker);
            } else {
              this.map.setView([lat, lng], 17);
            }
          } else {
            this.map.setView([lat, lng], 10);
          }
        }
      });
    }, 0);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
    window.removeEventListener("resize", this.setMapHeight.bind(this));
  }

  private initMap(): void {
    if (this.map) return;

    const mapElement = document.getElementById(this.mapId);
    if (!mapElement) {
      console.error(`Map container '${this.mapId}' not found.`);
      return;
    }

    this.map = L.map(this.mapId, {
      center: [39.8282, -98.5795],
      zoom: 3,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(this.map);
  }

  private loadMarkers(): void {
    this.dataService.getBeers().subscribe({
      next: (data) => {
        console.log("Raw data from API:", data);

        const beers = data?.beers || [];
        console.log("Number of beers received:", beers.length);

        if (!beers.length) {
          console.warn("No beer check-ins returned from API.");
        }

        // Optional: log first 5 beers for debugging
        beers
          .slice(0, 5)
          .forEach((b: { brewery: { brewery_name: any; location: { lat: any; lng: any; }; }; beer: { beer_name: any; }; }, i: any) =>
            console.log(
              `Beer ${i}: brewery=${b.brewery?.brewery_name}, beer=${b.beer?.beer_name}, lat=${b.brewery?.location?.lat}, lng=${b.brewery?.location?.lng}`,
            ),
          );

        // Add markers
        this.markerService.makeBreweryMarkers(this.map, beers);

        // Force map redraw
        this.map.invalidateSize();
      },
      error: (err) => {
        console.error("Error loading markers:", err);
      },
    });
  }

  private setMapHeight(): void {
    const mapElement = document.getElementById(this.mapId);
    if (mapElement) {
      mapElement.style.height = `${window.innerHeight}px`;
      if (this.map) this.map.invalidateSize();
    }
  }

  private smoothZoomToMarker(marker: L.Marker): void {
    if (!this.map || !this.markerService.markers) return;

    const maxZoom = this.map.getMaxZoom();
    if (this.map.hasLayer(marker)) {
      this.map.setView(marker.getLatLng(), maxZoom, {
        animate: true,
        duration: 0.5,
      });
      setTimeout(() => marker.openPopup(), 500);
    } else {
      this.markerService.markers.zoomToShowLayer(marker, () => {
        this.map.setView(marker.getLatLng(), maxZoom, {
          animate: true,
          duration: 0.5,
        });
        setTimeout(() => marker.openPopup(), 500);
      });
    }
  }
}
