import { AfterViewInit, Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MarkerService } from '../_services/marker.service';
import { MapService } from '../_services/map.service'; // Import MapService
import * as L from 'leaflet';

const iconRetinaUrl = '/assets/images/marker-icon-2x.png';
const iconUrl = 'assets/images/marker-icon.png';
const shadowUrl = 'assets/images/marker-shadow.png';

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
      this.mapId = data['mapId'];

      if (!this.mapId) {
        console.error("Map ID is not set. Cannot initialize the map.");
        return; // Prevent further execution
      }

      setTimeout(() => {
        this.initMap();
        if (this.map) {
          this.markerService.makeBreweryMarkers(this.map, this.markerIcon);
        } else {
          console.error("Map instance is not initialized.");
        }
      });
    });
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
        center: [39.8282, -98.5795],
        zoom: 3
      });

      const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      });

      tiles.addTo(this.map);
      this.mapService.addMap(this.mapId, this.map);
    }
  }

  ngOnDestroy(): void {
    // Cleanup map instance when the component is destroyed
    if (this.map) {
      this.map.remove();  // Removes the map instance from the DOM
      this.mapService.removeMap(this.mapId);  // Remove map from service
    }
  }
}
