import { Injectable } from "@angular/core";
import * as L from "leaflet";
import "leaflet.markercluster";

@Injectable({
  providedIn: "root",
})
export class MarkerService {
  public markers!: L.MarkerClusterGroup;

  // Default marker icon (local assets)
  private markerIcon = L.icon({
    iconRetinaUrl: "assets/images/marker-icon-2x.png",
    iconUrl: "assets/images/marker-icon.png",
    shadowUrl: "assets/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    tooltipAnchor: [16, -28],
    shadowSize: [41, 41],
  });

  constructor() {
    // Apply default icon globally (optional)
    L.Marker.prototype.options.icon = this.markerIcon;
  }

  /**
   * Add brewery markers to the map
   * @param map Leaflet map instance
   * @param beers Array of beer check-ins
   */
  public makeBreweryMarkers(map: L.Map, beers: any[]): void {
    if (!map) return;

    // Clear previous markers
    if (this.markers) this.markers.clearLayers();
    this.markers = L.markerClusterGroup();

    // Group beers by brewery
    const breweries: Record<string, any> = {};
    beers.forEach((beer) => {
      const breweryId = beer.brewery?.brewery_id;
      if (!breweryId) return;

      if (!breweries[breweryId]) {
        breweries[breweryId] = {
          lat: beer.brewery.location.lat,
          lon: beer.brewery.location.lng,
          name: beer.brewery.brewery_name,
          city: beer.brewery.location.brewery_city,
          state: beer.brewery.location.brewery_state,
          logo: beer.brewery.brewery_label,
          checkIns: [],
        };
      }

      breweries[breweryId].checkIns.push({
        beerName: beer.beer?.beer_name || "Unknown Beer",
        beerLabel:
          beer.beer?.beer_label ||
          "https://assets.untappd.com/site/assets/images/temp/badge-beer-default.png",
        beerStyle: beer.beer?.beer_style || "N/A",
        beerABV: beer.beer?.beer_abv || 0,
        rating: beer.rating_score || 0,
        count: beer.count || 1,
        checkInDate: beer.recent_created_at
          ? new Date(beer.recent_created_at).toLocaleString()
          : "Unknown Date",
        checkInId: beer.recent_checkin_id,
      });
    });

    // Create markers
    Object.values(breweries).forEach((brewery: any) => {
      const totalCheckIns = brewery.checkIns.length;

      // Build list of beers in popup
      const checkInsList = brewery.checkIns
        .map((c: any) => {
          return `
          <li style="list-style: none; margin-bottom: 5px;">
            <a href="https://untappd.com/c/${c.checkInId}" target="_blank" style="text-decoration: none; color: black;">
              <div style="display: flex; align-items: center;">
                <img src="${c.beerLabel}" alt="${c.beerName}" style="width:50px;height:50px;margin-right:10px"/>
                <div>
                  <strong>${c.beerName}${c.count > 1 ? ` (${c.count})` : ""}</strong><br/>
                  <small>Style: ${c.beerStyle}</small><br/>
                  <small>ABV: ${c.beerABV}%</small><br/>
                  <small>Rating: ${c.rating}/5</small><br/>
                  <small>Date: ${c.checkInDate}</small>
                </div>
              </div>
            </a>
          </li>`;
        })
        .join("");

      const popupContent = `
        <div style="padding:10px; color:black;">
          <div style="display:flex; align-items:center; margin-bottom:10px;">
            <img src="${brewery.logo}" alt="${brewery.name}" style="width:50px;height:50px;object-fit:cover;margin-right:10px"/>
            <div>
              <h3 style="margin:0 0 4px 0;font-size:16px;">${brewery.name}</h3>
              <p style="margin:0;">${brewery.city}, ${brewery.state}</p>
            </div>
          </div>
          <div style="margin-bottom:8px;">Check-ins: ${totalCheckIns}</div>
          <ul style="max-height:200px; overflow-y:auto; padding-left:0; margin:0;">
            ${checkInsList}
          </ul>
        </div>`;

      const marker = L.marker([brewery.lat, brewery.lon], {
        icon: this.markerIcon,
      }) as any;

      marker.breweryId = brewery.id;
      marker.bindPopup(popupContent);
      this.markers.addLayer(marker);
    });

    this.markers.addTo(map);
    map.invalidateSize(); // refresh map
  }

  /**
   * Get a marker by breweryId
   */
  public getMarkerByBreweryId(breweryId: string): L.Marker | undefined {
    if (!this.markers) return undefined;
    return this.markers
      .getLayers()
      .find((m: any) => m.breweryId === breweryId) as L.Marker;
  }
}
