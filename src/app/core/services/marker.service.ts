import { Injectable, PLATFORM_ID, inject } from "@angular/core";
import { isPlatformBrowser } from "@angular/common";
import * as L from "leaflet";
import "leaflet.markercluster";
import { BeerCheckin } from "../models/beer.model";
import { sanitizeUntappdUrl } from "../utils/url-utils";
import { PopUpService } from "./pop-up.service";

export const BREWERY_TYPE_COLORS: Record<string, string> = {
  "Micro Brewery": "#2e7d32", // Green
  Brewpub: "#1565c0", // Blue
  "Regional Brewery": "#6a1b9a", // Purple
  "Macro Brewery": "#c62828", // Red
  Cidery: "#f57f17", // Amber
  Meadery: "#ff8f00", // Orange
  "Contract Brewery": "#00838f", // Teal
  "Nano Brewery": "#43a047", // Light Green
  Taproom: "#d81b60", // Magenta/Pink
  Homebrew: "#8d6e63", // Brown
};
export const DEFAULT_BREWERY_COLOR = "#455a64"; // Slate Gray

export function extractBreweryType(brewery?: {
  brewery_type?: string;
}): string {
  if (!brewery || !brewery.brewery_type) return "Other";
  return brewery.brewery_type.trim();
}

export function getBreweryTypeColor(type?: string): string {
  if (!type) return DEFAULT_BREWERY_COLOR;
  const trimmed = type.trim();

  // Exact match
  if (BREWERY_TYPE_COLORS[trimmed]) return BREWERY_TYPE_COLORS[trimmed];

  // Case-insensitive match
  const lower = trimmed.toLowerCase();
  for (const [key, color] of Object.entries(BREWERY_TYPE_COLORS)) {
    if (key.toLowerCase() === lower) return color;
  }

  // Substring match heuristics
  if (lower.includes("micro")) return BREWERY_TYPE_COLORS["Micro Brewery"];
  if (lower.includes("pub")) return BREWERY_TYPE_COLORS["Brewpub"];
  if (lower.includes("regional"))
    return BREWERY_TYPE_COLORS["Regional Brewery"];
  if (lower.includes("macro")) return BREWERY_TYPE_COLORS["Macro Brewery"];
  if (lower.includes("cider")) return BREWERY_TYPE_COLORS["Cidery"];
  if (lower.includes("mead")) return BREWERY_TYPE_COLORS["Meadery"];
  if (lower.includes("nano")) return BREWERY_TYPE_COLORS["Nano Brewery"];
  if (lower.includes("taproom")) return BREWERY_TYPE_COLORS["Taproom"];

  return DEFAULT_BREWERY_COLOR;
}

export interface BreweryMarkerData {
  breweryId?: string;
  name?: string;
  breweryType?: string;
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
    breweryType?: string;
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
  private platformId = inject(PLATFORM_ID);
  private popUpService = inject(PopUpService);
  public markers: L.MarkerClusterGroup | undefined;
  private breweryMarkers: BreweryMarker[] = [];

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Safely initialize markerClusterGroup to handle production bundling variations
      const windowRef = window as unknown as {
        L?: { markerClusterGroup?: () => L.MarkerClusterGroup };
      };
      const Lref =
        windowRef.L ||
        (L as unknown as { markerClusterGroup?: () => L.MarkerClusterGroup });
      if (typeof Lref.markerClusterGroup === "function") {
        this.markers = Lref.markerClusterGroup();
      } else {
        console.error(
          "Leaflet.markercluster plugin not found on L or window.L",
        );
      }
    }
  }

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
    if (!map || !this.markers) return;

    const createCustomIcon = (color: string): L.DivIcon => {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="42" filter="drop-shadow(0px 2px 4px rgba(0,0,0,0.4))"><path fill="${color}" stroke="#ffffff" stroke-width="1.5" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/><circle cx="12" cy="9" r="3.5" fill="#ffffff"/></svg>`;
      return L.divIcon({
        html: svg,
        className: "custom-svg-marker",
        iconSize: [30, 42],
        iconAnchor: [15, 42],
        popupAnchor: [0, -38],
      });
    };

    // Aggregate beers by brewery
    const breweryCounts: Record<
      string,
      {
        lat: number;
        lon: number;
        id: string;
        name: string;
        breweryType: string;
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
        const logo =
          beer.brewery.brewery_label ??
          "https://assets.untappd.com/site/assets/images/temp/badge-beer-default.png";
        breweryCounts[breweryId] = {
          lat,
          lon,
          id: breweryId,
          name: beer.brewery.brewery_name,
          breweryType: extractBreweryType(beer.brewery),
          city: beer.brewery.location.brewery_city ?? "",
          state: beer.brewery.location.brewery_state ?? "",
          logo: sanitizeUntappdUrl(logo) || logo,
          checkIns: [],
        };
      }

      const beerLabel =
        beer.beer.beer_label ??
        "https://assets.untappd.com/site/assets/images/temp/badge-beer-default.png";
      breweryCounts[breweryId].checkIns.push({
        beerName: beer.beer.beer_name ?? "Unknown",
        beerLabel: sanitizeUntappdUrl(beerLabel) || beerLabel,
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
      const { lat, lon, name, breweryType, city, state, logo, checkIns, id } =
        breweryCounts[key];

      const color = getBreweryTypeColor(breweryType);
      const icon = createCustomIcon(color);

      const marker = L.marker([lat, lon], { icon }) as BreweryMarker;
      marker.breweryId = id;
      marker.checkInsData = { name, breweryType, city, state, logo, checkIns };

      const popupHtml = this.popUpService.makePopup(
        name,
        state,
        city,
        logo,
        checkIns.length,
      );
      marker.bindPopup(popupHtml, {
        offset: L.point(0, -28),
        className: "custom-brewery-popup",
        autoClose: true,
        closeOnClick: true,
      });

      if (onClick) {
        marker.on("click", () =>
          onClick({
            breweryId: id,
            name,
            breweryType,
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
