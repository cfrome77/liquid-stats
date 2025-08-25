import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MarkerService } from '../../core/services/marker.service';
import { MapService } from '../../core/services/map.service';
import * as L from 'leaflet';
import 'leaflet.markercluster';

const iconRetinaUrl = '/assets/images/marker-icon-2x.png';
const iconUrl = '/assets/images/marker-icon.png';
const shadowUrl = '/assets/images/marker-shadow.png';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})
export class MapComponent implements AfterViewInit, OnDestroy {

  public mapId: string = 'myMap';
  private map: L.Map | undefined;

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

  constructor(
    private markerService: MarkerService,
    private mapService: MapService,
    private route: ActivatedRoute
  ) { }

  ngAfterViewInit(): void {
    this.route.data.subscribe(data => {
      this.mapId = data['mapId'] || 'myMap';

      setTimeout(() => {
        this.initMap();

        if (!this.map) return;

        this.markerService.makeBreweryMarkers(this.map, this.markerIcon);

        this.route.queryParams.subscribe(params => {
          const lat = parseFloat(params['lat']);
          const lng = parseFloat(params['lng']);
          const breweryId = params['breweryId'];

          if (!isNaN(lat) && !isNaN(lng) && breweryId && this.markerService.markers) {
            const marker = this.markerService.getMarkerByBreweryId(breweryId);

            if (marker) {
              this.smoothZoomToMarker(marker);
            } else {
              this.map!.setView([lat, lng], 17);
            }
          }
        });
      });
    });
  }

  /**
   * Smoothly zooms to a marker by expanding clusters and then setting the max zoom.
   */
  private smoothZoomToMarker(marker: L.Marker): void {
    if (!this.markerService.markers || !this.map) {
      return;
    }

    const maxZoom = this.map.getMaxZoom();

    // Check if the marker is already visible on the map (not in a cluster).
    if (this.map.hasLayer(marker)) {
      const targetZoom = maxZoom;
      this.map.setView(marker.getLatLng(), targetZoom, { animate: true, duration: 0.5 });
      setTimeout(() => marker.openPopup(), 500);
    } else {
      // If the marker is in a cluster, use zoomToShowLayer to expand it.
      this.markerService.markers.zoomToShowLayer(marker, () => {
        const targetZoom = maxZoom;
        this.map!.setView(marker.getLatLng(), targetZoom, { animate: true, duration: 0.5 });
        setTimeout(() => marker.openPopup(), 500);
      });
    }
  }

  private initMap(): void {
    if (!this.mapId) {
      console.error("Map ID is not set. Cannot initialize the map.");
      return;
    }

    const mapElement = document.getElementById(this.mapId);
    if (!mapElement) {
      console.error(`Map container with id '${this.mapId}' not found in the DOM.`);
      return;
    }

    if (!this.map) {
      this.map = L.map(this.mapId, {
        center: [39.8282, -98.5795], // Coordinates for the USA
        zoom: 3
      });

      const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      });

      tiles.addTo(this.map);
      this.mapService.addMap(this.mapId, this.map);

      this.setMapHeight();
      window.addEventListener('resize', this.setMapHeight.bind(this));
    }
  }

  private setMapHeight(): void {
    const mapElement = document.getElementById(this.mapId);
    if (mapElement) {
      mapElement.style.height = `${window.innerHeight}px`;
    }
    if (this.map) {
      this.map.invalidateSize();
    }
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.mapService.removeMap(this.mapId);
    }
    window.removeEventListener('resize', this.setMapHeight.bind(this));
  }
}