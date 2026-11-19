import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  flush,
} from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { ActivatedRoute } from "@angular/router";
import { of, throwError } from "rxjs";
import { MapComponent } from "./map.component";
import {
  MarkerService,
  BreweryMarker,
} from "../../core/services/marker.service";
import * as L from "leaflet";
import { DataService } from "../../core/services/data.service";

describe("MapComponent", () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;
  let mockMarkerService: jasmine.SpyObj<MarkerService>;
  let mockDataService: jasmine.SpyObj<DataService>;

  beforeEach(async () => {
    // Mock MarkerService
    mockMarkerService = jasmine.createSpyObj("MarkerService", [
      "makeBreweryMarkers",
      "getMarkerByBreweryId",
      "setSelectedMarker",
    ]);
    mockMarkerService.markers = jasmine.createSpyObj("MarkerClusterGroup", [
      "clearLayers",
      "addLayer",
      "zoomToShowLayer",
    ]) as unknown as L.MarkerClusterGroup;

    // Mock DataService
    mockDataService = jasmine.createSpyObj("DataService", [
      "getBeersAll",
      "clearCache",
    ]);
    mockDataService.getBeersAll.and.returnValue(of([]));

    // Configure TestBed
    await TestBed.configureTestingModule({
      imports: [MapComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: DataService, useValue: mockDataService },
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ mapId: "myMap" }),
            queryParams: of({}),
          },
        },
      ],
    })
      .overrideComponent(MapComponent, {
        set: {
          providers: [{ provide: MarkerService, useValue: mockMarkerService }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("shows the empty state and stops loading when there is no data", fakeAsync(() => {
    const mapDiv = document.createElement("div");
    mapDiv.id = "myMap";
    mapDiv.style.width = "100px";
    mapDiv.style.height = "100px";
    document.body.appendChild(mapDiv);

    fixture.detectChanges();
    tick(200);
    flush();

    expect(component.isLoading()).toBeFalse();
    expect(component.dataLoaded()).toBeTrue();
    expect(component.hasData()).toBeFalse();

    const text = (fixture.nativeElement as HTMLElement).textContent ?? "";
    expect(text).toContain("No brewery locations");

    fixture.destroy();
    document.body.removeChild(mapDiv);
  }));

  it("shows the empty state when the data request fails", fakeAsync(() => {
    mockDataService.getBeersAll.and.returnValue(
      throwError(() => new Error("network error")),
    );

    const mapDiv = document.createElement("div");
    mapDiv.id = "myMap";
    mapDiv.style.width = "100px";
    mapDiv.style.height = "100px";
    document.body.appendChild(mapDiv);

    fixture.detectChanges();
    tick(200);
    flush();

    expect(component.isLoading()).toBeFalse();
    expect(component.dataLoaded()).toBeTrue();
    expect(component.hasData()).toBeFalse();

    fixture.destroy();
    document.body.removeChild(mapDiv);
  }));

  it("shows an error state with a retry that refetches and recovers", fakeAsync(() => {
    const mapDiv = document.createElement("div");
    mapDiv.id = "myMap";
    mapDiv.style.width = "100px";
    mapDiv.style.height = "100px";
    document.body.appendChild(mapDiv);

    // First request fails, the retry succeeds.
    mockDataService.getBeersAll.and.returnValues(
      throwError(() => new Error("network error")),
      of([]),
    );

    fixture.detectChanges();
    tick(200);
    flush();

    expect(component.hasError()).toBeTrue();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? "";
    expect(text).toContain("couldn't load the brewery map");

    component.retryLoad();
    fixture.detectChanges();
    tick(200);
    flush();

    expect(mockDataService.clearCache).toHaveBeenCalled();
    expect(component.hasError()).toBeFalse();

    fixture.destroy();
    document.body.removeChild(mapDiv);
  }));

  it("should initialize map on AfterViewInit", fakeAsync(() => {
    // Add a div with the mapId in the DOM for Leaflet
    const mapDiv = document.createElement("div");
    mapDiv.id = "myMap";
    mapDiv.style.width = "100px";
    mapDiv.style.height = "100px";
    document.body.appendChild(mapDiv);

    fixture.detectChanges();
    tick(200);
    flush();

    expect(mockMarkerService.makeBreweryMarkers).toHaveBeenCalled();

    fixture.destroy();
    document.body.removeChild(mapDiv);
  }));

  it("should use zoomToShowLayer for deep links when marker exists", fakeAsync(() => {
    // Add a div with the mapId in the DOM for Leaflet
    const mapDiv = document.createElement("div");
    mapDiv.id = "myMap";
    mapDiv.style.width = "100px";
    mapDiv.style.height = "100px";
    document.body.appendChild(mapDiv);

    // Mock marker
    const mockMarker = {
      getElement: jasmine
        .createSpy("getElement")
        .and.returnValue(document.createElement("div")),
      getLatLng: jasmine
        .createSpy("getLatLng")
        .and.returnValue({ lat: 10, lng: 20 }),
      breweryId: "brewery-1",
      checkInsData: {
        name: "Test Brewery",
        city: "Test City",
        state: "TS",
        logo: "logo.png",
        checkIns: [],
      },
    };

    mockMarkerService.getMarkerByBreweryId.and.returnValue(
      mockMarker as unknown as BreweryMarker,
    );
    (mockMarkerService.markers!.zoomToShowLayer as jasmine.Spy).and.callFake(
      (m: unknown, cb: () => void) => cb(),
    );

    // Trigger AfterViewInit
    fixture.detectChanges();
    tick(200);

    // Call private handleDeepLink to test zoom
    (
      component as unknown as {
        handleDeepLink: (lat: number, lng: number, id: string) => void;
      }
    ).handleDeepLink(10, 20, "brewery-1");

    expect(mockMarkerService.markers!.zoomToShowLayer).toHaveBeenCalledWith(
      mockMarker as unknown as L.Layer,
      jasmine.any(Function),
    );

    fixture.destroy();
    document.body.removeChild(mapDiv);
  }));

  it("removes the panel and marker highlight when the map background is clicked", fakeAsync(() => {
    const mapDiv = document.createElement("div");
    mapDiv.id = "myMap";
    mapDiv.style.width = "100px";
    mapDiv.style.height = "100px";
    document.body.appendChild(mapDiv);

    fixture.detectChanges();
    tick(200);
    flush();

    mockMarkerService.getMarkerByBreweryId.and.returnValue({
      breweryId: "brewery-1",
      checkInsData: {
        name: "Test Brewery",
        city: "Test City",
        state: "TS",
        logo: "logo.png",
        checkIns: [],
      },
    } as unknown as BreweryMarker);

    component.openBreweryOverlay("brewery-1");
    fixture.detectChanges(false);
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector(".map-info-panel")).toBeTruthy();

    // Leaflet dispatches this outside the Angular zone in the real app.
    component.closeBreweryOverlay();
    fixture.detectChanges(false);

    expect(component.selectedBrewery).toBeNull();
    expect(mockMarkerService.setSelectedMarker).toHaveBeenCalledWith(null);
    expect(host.querySelector(".map-info-panel")).toBeFalsy();

    fixture.destroy();
    document.body.removeChild(mapDiv);
  }));

  it("traps focus inside the brewery overlay while it is open", fakeAsync(() => {
    const mapDiv = document.createElement("div");
    mapDiv.id = "myMap";
    mapDiv.style.width = "100px";
    mapDiv.style.height = "100px";
    document.body.appendChild(mapDiv);

    fixture.detectChanges();
    tick(200);
    flush();

    mockMarkerService.getMarkerByBreweryId.and.returnValue({
      breweryId: "brewery-1",
      checkInsData: {
        name: "Test Brewery",
        city: "Test City",
        state: "TS",
        logo: "logo.png",
        checkIns: [],
      },
    } as unknown as BreweryMarker);

    component.openBreweryOverlay("brewery-1");
    // The component already ran change detection; skip the dev-only
    // checkNoChanges pass which trips over Leaflet mutating the DOM.
    fixture.detectChanges(false);

    const host = fixture.nativeElement as HTMLElement;
    const panel = host.querySelector(".map-info-panel") as HTMLElement;
    expect(panel).toBeTruthy();
    expect(panel.getAttribute("role")).toBe("dialog");
    expect(panel.getAttribute("aria-modal")).toBe("true");

    // cdkTrapFocus inserts a start/end anchor pair around the trapped region.
    // Scope to the panel's parent so the sidenav's own trap is not counted.
    const anchors = panel.parentElement!.querySelectorAll(
      ".cdk-focus-trap-anchor",
    );
    expect(anchors.length).toBe(2);
    for (const anchor of Array.from(anchors)) {
      expect(panel.parentElement?.contains(anchor)).toBeTrue();
    }

    fixture.destroy();
    document.body.removeChild(mapDiv);
  }));

  it("closes the brewery overlay when Escape is pressed", fakeAsync(() => {
    const mapDiv = document.createElement("div");
    mapDiv.id = "myMap";
    mapDiv.style.width = "100px";
    mapDiv.style.height = "100px";
    document.body.appendChild(mapDiv);

    fixture.detectChanges();
    tick(200);
    flush();

    mockMarkerService.getMarkerByBreweryId.and.returnValue({
      breweryId: "brewery-1",
      checkInsData: {
        name: "Test Brewery",
        city: "Test City",
        state: "TS",
        logo: "logo.png",
        checkIns: [],
      },
    } as unknown as BreweryMarker);

    component.openBreweryOverlay("brewery-1");
    fixture.detectChanges(false);
    expect(component.selectedBrewery).not.toBeNull();
    expect(mockMarkerService.setSelectedMarker).toHaveBeenCalledWith(
      "brewery-1",
    );

    document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
    fixture.detectChanges(false);

    expect(component.selectedBrewery).toBeNull();
    expect(mockMarkerService.setSelectedMarker).toHaveBeenCalledWith(null);

    fixture.destroy();
    document.body.removeChild(mapDiv);
  }));
});
