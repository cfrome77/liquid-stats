import {
  Component,
  AfterViewInit,
  Inject,
  PLATFORM_ID,
  OnDestroy,
  ChangeDetectorRef,
} from "@angular/core";
import { isPlatformBrowser, CommonModule } from "@angular/common";
import { MarkerService } from "src/app/core/services/marker.service";
import { DataService } from "src/app/core/services/data.service";
import * as L from "leaflet";
import "leaflet.markercluster";
import { PoweredByComponent } from "../../shared/components/powered-by/powered-by.component";

const iconUrl = "/assets/images/marker-icon.png";
const shadowUrl = "/assets/images/marker-shadow.png";

@Component({
  selector: "app-map",
  templateUrl: "./map.component.html",
  styleUrls: ["./map.component.css"],
  standalone: true,
  imports: [CommonModule, PoweredByComponent],
})
export class MapComponent implements AfterViewInit, OnDestroy {
  public mapId = "myMap";
  private map: any;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    private markerService: MarkerService,
    private dataService: DataService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngAfterViewInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.initMap();
      this.dataService.getBeers().subscribe({
        next: (data) => {
          const beers = data?.response?.checkins?.items || [];
          this.markerService.makeBreweryMarkers(this.map, beers);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error("Error fetching map data:", err);
        },
      });
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }

  private initMap(): void {
    if (this.map) return;
    const iconDefault = L.icon({
      iconUrl,
      shadowUrl,
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

    const tiles = L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 18,
        minZoom: 3,
        attribution:
          '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      },
    );

    tiles.addTo(this.map);
  }
}
