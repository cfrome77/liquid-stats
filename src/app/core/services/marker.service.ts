import { Injectable } from '@angular/core';
import { DataService } from 'src/app/core/services/data.service';

import * as L from 'leaflet';
import "leaflet.markercluster";

@Injectable({
  providedIn: 'root'
})
export class MarkerService {

  private beersUrl: string = 'https://liquid-stats.s3.amazonaws.com/beers.json';
  public markers!: L.MarkerClusterGroup;

  constructor(private dataService: DataService) { }

  /**
   * Create brewery markers on the map.
   */
  public makeBreweryMarkers(map: L.Map, markerIcon: L.Icon, filteredBeers?: any[]): void {
    if (this.markers) {
      this.markers.clearLayers();
    }
    this.markers = L.markerClusterGroup();

    const breweryCounts: Record<string, {
      lat: number;
      lon: number;
      id: string;
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

    this.dataService.getBeers().subscribe({
      next: (res: any) => {
        const beersList = filteredBeers && filteredBeers.length ? filteredBeers : res.beers;

        for (const beer of beersList) {
          const lat = beer.brewery.location.lat;
          const lon = beer.brewery.location.lng;
          const breweryId = beer.brewery.brewery_id;
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

          // Use the actual brewery_id as the key
          const uniqueKey = `${breweryId}`;

          if (!breweryCounts[uniqueKey]) {
            breweryCounts[uniqueKey] = {
              lat,
              lon,
              id: breweryId,
              name: breweryName,
              city: breweryCity,
              state: breweryState,
              logo: breweryLogo,
              checkIns: []
            };
          }

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

        // Create markers
        for (const key in breweryCounts) {
          const { lat, lon, name, city, state, logo, checkIns, id } = breweryCounts[key];

          const totalCheckIns = checkIns.length;

          const checkInsList = checkIns.map(checkIn => {
            const beerCheckInCount = checkIn.count;
            // Updated to handle missing beer name data
            const displayedBeerName = checkIn.beerName || 'Name not available';

            return `
            <li style="color: black; list-style-type: none; margin-bottom: 10px;">
              <div style="display: flex; align-items: center;">
                <img src="${checkIn.beerLabel}" alt="${displayedBeerName}" style="width: 50px; height: 50px; margin-right: 10px;"/>
                <div style="color: black;">
                  <strong style="color: black;">${displayedBeerName}${beerCheckInCount > 1 ? ` (${beerCheckInCount})` : ''}</strong><br>
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
  <div style="text-align: left; color: black; padding: 10px 12px 10px 12px;">
    <div style="display: flex; align-items: center; margin-bottom: 10px;">
      <img src="${logo}" alt="${name}" 
           style="width: 50px; height: 50px; object-fit: cover; margin-right: 10px;"/>
      <div>
        <h3 style="margin: 0 0 4px 0; color: black; font-size: 16px; line-height: 1.2;">
          ${name}
        </h3>
        <p style="margin: 0; color: black;">${city}, ${state}</p>
      </div>
    </div>
    <div style="color: black; margin-bottom: 8px;">
      Check-ins: ${totalCheckIns}
    </div>
    <ul style="max-height: 200px; overflow-y: auto; padding-left: 0; margin: 0; color: black;">
      ${checkInsList}
    </ul>
  </div>
`;


          const popup = L.popup().setContent(popupContent);

          const marker = L.marker([lat, lon], { icon: markerIcon }) as any;
          marker.breweryId = id;
          marker.bindPopup(popup);
          this.markers.addLayer(marker);
        }

        this.markers.addTo(map);
      },
      error: (err) => {
        console.error('Error fetching beers:', err);
      },
      complete: () => {
        console.log('Beers fetch completed');
      }
    });
  }

  /**
   * Find a marker by its breweryId
   */
  public getMarkerByBreweryId(breweryId: string): L.Marker | undefined {
    return this.markers.getLayers().find((m: any) => m.breweryId === breweryId) as L.Marker;
  }
}