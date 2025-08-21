import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { PopUpService } from './pop-up.service';

import * as L from 'leaflet';
import "leaflet.markercluster";

@Injectable({
  providedIn: 'root'
})
export class MarkerService {

  beers: string = 'https://liquid-stats.s3.amazonaws.com/beers.json';

  constructor(private http: HttpClient,
    private popupService: PopUpService) { }

  makeBreweryMarkers(map: L.Map, markerIcon: L.Icon): void {
    const markers = L.markerClusterGroup();
    const breweryCounts: Record<string, {
      lat: number;
      lon: number;
      name: string;
      city: string;
      state: string;
      logo: string;
      checkIns: {
        beerName: string;
        beerLabel: string;
        beerABV: number;
        beerStyle: string;
        beerDescription: string;
        rating: number;
        checkInDate: string;
        count: number;
      }[];
    }> = {};

    this.http.get(this.beers).subscribe((res: any) => {
      for (const beer of res.beers) {
        const lat = beer.brewery.location.lat;
        const lon = beer.brewery.location.lng;
        const breweryName = beer.brewery.brewery_name;
        const breweryCity = beer.brewery.location.brewery_city;
        const breweryState = beer.brewery.location.brewery_state;
        const breweryLogo = beer.brewery.brewery_label;

        const beerName = beer.beer.beer_name;
        const beerLabel = beer.beer.beer_label || 'https://assets.untappd.com/site/assets/images/temp/badge-beer-default.png';
        const beerABV = beer.beer.beer_abv;
        const beerStyle = beer.beer.beer_style;
        const beerDescription = beer.beer.beer_description;
        const rating = beer.rating_score;
        const checkInDate = beer.recent_created_at ? new Date(beer.recent_created_at).toLocaleString() : 'Unknown Date';
        const count = beer.count || 1;

        // Create a unique key based on brewery name, lat, and lon
        const uniqueKey = `${breweryName}-${lat}-${lon}`;

        // If the brewery doesn't exist yet, create an entry for it
        if (!breweryCounts[uniqueKey]) {
          breweryCounts[uniqueKey] = {
            lat,
            lon,
            name: breweryName,
            city: breweryCity,
            state: breweryState,
            logo: breweryLogo,
            checkIns: []
          };
        }

        // Add check-in information for this brewery
        breweryCounts[uniqueKey].checkIns.push({
          beerName,
          beerLabel,
          beerABV,
          beerStyle,
          beerDescription,
          rating,
          checkInDate,
          count
        });
      }

      // Now create markers based on the counts
      for (const key in breweryCounts) {
        const { lat, lon, name, city, state, logo, checkIns } = breweryCounts[key];

        // Calculate total check-ins for the brewery
        const totalCheckIns = checkIns.length;

        // Create a scrollable list of check-ins
        const checkInsList = checkIns.map(checkIn => {
          // Use the count variable from the data
          const beerCheckInCount = checkIn.count;

          return `
            <li style="color: black; list-style-type: none; margin-bottom: 10px;">
              <div style="display: flex; align-items: center;">
                <img src="${checkIn.beerLabel}" alt="${checkIn.beerName}" style="width: 50px; height: 50px; margin-right: 10px;"/>
                <div style="color: black;">
                  <strong>${checkIn.beerName}${beerCheckInCount > 1 ? ` (${beerCheckInCount})` : ''}</strong><br>
                  <small>Style: ${checkIn.beerStyle}</small><br>
                  <small>ABV: ${checkIn.beerABV}%</small><br>
                  <small>Rating: ${checkIn.rating}/5</small><br>
                  <small>Date: ${checkIn.checkInDate}</small><br>
                </div>
              </div>
            </li>
          `;
        }).join('');

        const popupContent = `
          <div style="text-align: left; color: black;">
            <div style="display: flex; align-items: center; margin-bottom: 10px;">
              <img src="${logo}" alt="${name}" style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px;"/>
              <div>
                <h3 style="margin: 0; color: black;">${name}</h3>
                <p style="margin: 0; color: black;">${city}, ${state}</p>
              </div>
            </div>
            <div style="color: black;">
              Check-ins: ${totalCheckIns}
            </div>
            <ul style="max-height: 200px; overflow-y: scroll; padding-left: 0; color: black;">
              ${checkInsList}
            </ul>
          </div>
        `;

        const popup = L.popup().setContent(popupContent);

        const marker = L.marker([lat, lon], { icon: markerIcon });
        marker.bindPopup(popup);
        markers.addLayer(marker);
      }

      // Add all markers to the map after processing
      markers.addTo(map);
    });
  }
}