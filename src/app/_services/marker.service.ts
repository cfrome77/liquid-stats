import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PopUpService } from './pop-up.service';

import * as L from 'leaflet';
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import 'leaflet/dist/leaflet.css';

@Injectable({
  providedIn: 'root'
})
export class MarkerService {

  beers: string = 'https://liquid-stats.s3.amazonaws.com/beers.json';

  constructor(private http: HttpClient,
    private popupService: PopUpService) {
  }

  makeBreweryMarkers(map: L.Map, markerIcon: L.Icon): void {
    const markers = L.markerClusterGroup();
    const breweryCounts: Record<string, { count: number; lat: number; lon: number; name: string; city: string; state: string }> = {}; // To track counts

    this.http.get(this.beers).subscribe((res: any) => {
      for (const beer of res.beers) {
        const lat = beer.brewery.location.lat;
        const lon = beer.brewery.location.lng;
        const breweryName = beer.brewery.brewery_name;
        const breweryCity = beer.brewery.location.brewery_city;
        const breweryState = beer.brewery.location.brewery_state;

        // Create a unique key based on name, lat, and lon
        const uniqueKey = `${breweryName}-${lat}-${lon}`;

        // Check if this key has already been seen
        if (breweryCounts[uniqueKey]) {
          breweryCounts[uniqueKey].count++; // Increment count for existing brewery
        } else {
          // Initialize the count and location
          breweryCounts[uniqueKey] = { count: 1, lat: lat, lon: lon, name: breweryName, city: breweryCity, state: breweryState };
        }
      }

      // Now create markers based on the counts
      for (const key in breweryCounts) {
        const { count, lat, lon, name, city, state } = breweryCounts[key];

        // Create the marker for this unique location
        const marker = L.marker([lat, lon], { icon: markerIcon });
        const popupContent = `<div style="text-align: center;">${name}<br>${city}, ${state}<br>Checkins: ${count}</div>`; // Customize popup content to include count
        const popup = L.popup().setContent(popupContent);

        marker.bindPopup(popup);
        markers.addLayer(marker); // Add marker to the marker cluster group
      }

      // Add all markers to the map after processing
      markers.addTo(map);
    });
  }
}
