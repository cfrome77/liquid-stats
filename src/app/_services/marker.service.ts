import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { PopUpService } from './pop-up.service';

@Injectable({
  providedIn: 'root'
})
export class MarkerService {

  beers: string = 'https://liquid-stats.s3.amazonaws.com/beers.json';

  static ScaledRadius(val: number, maxVal: number): number {
    return 20 * (val / maxVal);
  }

  constructor(private http: HttpClient,
    private popupService: PopUpService) {
  }

  makeBreweryMarkers(map: L.Map, markerIcon: L.Icon): void {
    this.http.get(this.beers).subscribe((res: any) => {
      for (const beer of res.beers) {
        const lat = beer.brewery.location.lat;
        const lon = beer.brewery.location.lng;
        const marker = L.marker([lat, lon], {icon: markerIcon });
        var popup = L.popup().setContent(this.popupService.makePopup(beer.brewery.brewery_name, beer.brewery.location.brewery_state, beer.brewery.location.brewery_city));
        marker.bindPopup(popup);
        marker.addTo(map);
      }
    });
  }
}
