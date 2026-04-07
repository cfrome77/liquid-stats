import { Injectable } from "@angular/core";
import * as L from "leaflet";
import "leaflet.markercluster";
import { BeerCheckin } from "../models/beer.model";

export interface BreweryMarkerData {
  breweryId?: string;
  name?: string;
  city?: string;
  state?: string;
  logo?: string;
  checkIns?: {
    beerName: string;
    beerLabel: string;
    beerABV: number;
    beerStyle: string;
    rating: number;
    checkInId: number;
  }[];
}

export interface BreweryMarker extends L.Marker {
  breweryId?: string;
  checkInsData?: {
    name: string;
    city: string;
    state: string;
    logo: string;
    checkIns: {
      beerName: string;
      beerLabel: string;
      beerABV: number;
      beerStyle: string;
      rating: number;
      checkInId: number;
    }[];
  };
}

@Injectable()
export class MarkerService {
  public markers: L.MarkerClusterGroup = L.markerClusterGroup();
  private breweryMarkers: BreweryMarker[] = [];

  constructor() {}

  /**
   * Create/update brewery markers
   * @param map Leaflet map
   * @param beers BeerCheckin[] filtered beers
   * @param onClick Optional callback when a marker is clicked
   */
  public makeBreweryMarkers(
    map: L.Map,
    beers: BeerCheckin[],
    onClick?: (breweryData: BreweryMarkerData) => void,
  ): void {
    if (!map) return;

    // Aggregate beers by brewery
    const breweryCounts: Record<
      string,
      {
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
          rating: number;
          checkInId: number;
        }[];
      }
    > = {};

    for (const beer of beers) {
      const lat = beer.brewery.location.lat ?? 0;
      const lon = beer.brewery.location.lng ?? 0;
      const breweryId = beer.brewery.brewery_id?.toString() ?? "unknown";

      if (!breweryCounts[breweryId]) {
        breweryCounts[breweryId] = {
          lat,
          lon,
          id: breweryId,
          name: beer.brewery.brewery_name,
          city: beer.brewery.location.brewery_city ?? "",
          state: beer.brewery.location.brewery_state ?? "",
          logo:
            beer.brewery.brewery_label ??
            "https://assets.untappd.com/site/assets/images/temp/badge-beer-default.png",
          checkIns: [],
        };
      }

      breweryCounts[breweryId].checkIns.push({
        beerName: beer.beer.beer_name ?? "Unknown",
        beerLabel:
          beer.beer.beer_label ??
          "https://assets.untappd.com/site/assets/images/temp/badge-beer-default.png",
        beerABV: beer.beer.beer_abv ?? 0,
        beerStyle: beer.beer.beer_style ?? "Unknown",
        rating: beer.rating_score ?? 0,
        checkInId: beer.recent_checkin_id ?? 0,
      });
    }

    // Clear previous markers and rebuild
    this.markers.clearLayers();
    this.breweryMarkers = [];

    for (const key in breweryCounts) {
      const { lat, lon, name, city, state, logo, checkIns, id } =
        breweryCounts[key];

      const marker = L.marker([lat, lon]) as BreweryMarker;
      marker.breweryId = id;
      marker.checkInsData = { name, city, state, logo, checkIns };

      if (onClick) {
        marker.on("click", () =>
          onClick({
            breweryId: id,
            name,
            city,
            state,
            logo,
            checkIns,
          }),
        );
      }

      this.markers.addLayer(marker);
      this.breweryMarkers.push(marker);
    }

    // Add cluster layer to map if not already
    if (!map.hasLayer(this.markers)) {
      map.addLayer(this.markers);
    }
  }

  /** Get a marker by brewery ID */
  public getMarkerByBreweryId(breweryId: string): BreweryMarker | undefined {
    return this.breweryMarkers.find((m) => m.breweryId === breweryId);
  }
}
