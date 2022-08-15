import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as L from 'leaflet';
import { PopUpService } from './pop-up.service';

@Injectable({
  providedIn: 'root'
})
export class MarkerService {

  capitals: string = '/assets/data/usa-capitals.geojson';

  static ScaledRadius(val: number, maxVal: number): number {
    return 20 * (val / maxVal);
  }

  constructor(private http: HttpClient,
    private popupService: PopUpService) {
  }

  makeCapitalMarkers(map: L.Map, markerIcon: L.Icon): void {
    this.http.get(this.capitals).subscribe((res: any) => {
      for (const c of res.features) {
        const lat = c.geometry.coordinates[0];
        const lon = c.geometry.coordinates[1];
        const marker = L.marker([lon, lat], {icon: markerIcon });
        var popup = L.popup().setContent(this.popupService.makeCapitalPopup(c.properties));
        marker.bindPopup(popup);
        marker.addTo(map);
      }
    });
  }
}
