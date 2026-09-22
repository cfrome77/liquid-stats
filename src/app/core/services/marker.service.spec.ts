import { TestBed } from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import {
  MarkerService,
  extractBreweryType,
  getBreweryTypeColor,
} from "./marker.service";
import { PopUpService } from "./pop-up.service";
import * as L from "leaflet";
import { BeerCheckin } from "../models/beer.model";

describe("MarkerService", () => {
  let service: MarkerService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [MarkerService, PopUpService],
    });
    service = TestBed.inject(MarkerService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should fallback brewery_type, type_name, and brewery_type_name in extractBreweryType", () => {
    expect(extractBreweryType({ brewery_type: "Micro Brewery" })).toBe(
      "Micro Brewery",
    );
    expect(extractBreweryType({ type_name: "Brewpub" })).toBe("Brewpub");
    expect(extractBreweryType({ brewery_type_name: "Regional Brewery" })).toBe(
      "Regional Brewery",
    );
    expect(extractBreweryType({})).toBe("Other");
    expect(getBreweryTypeColor("micro brewery")).toBe("#2e7d32");
  });

  it("should create markers and bind popups", () => {
    const mockMap = L.map(document.createElement("div"), {
      center: [0, 0],
      zoom: 1,
      maxZoom: 18,
    });

    const mockBeers: BeerCheckin[] = [
      {
        beer: {
          bid: 1,
          beer_name: "Test Beer",
          beer_style: "IPA",
          beer_abv: 6.5,
          beer_label: "label.png",
        },
        brewery: {
          brewery_id: 101,
          brewery_name: "Test Brewery",
          brewery_label: "logo.png",
          country_name: "USA",
          location: {
            lat: 37.7749,
            lng: -122.4194,
            brewery_city: "San Francisco",
            brewery_state: "CA",
          },
        },
        rating_score: 4.5,
        recent_checkin_id: 1234,
        recent_created_at: "2026-01-01T00:00:00Z",
        first_created_at: "2026-01-01T00:00:00Z",
        count: 1,
      },
    ];

    service.makeBreweryMarkers(mockMap, mockBeers);
    const marker = service.getMarkerByBreweryId("101");
    expect(marker).toBeTruthy();
    expect(marker?.getPopup()).toBeTruthy();
    expect(marker?.getPopup()?.getContent()).toContain("Test Brewery");
  });
});
