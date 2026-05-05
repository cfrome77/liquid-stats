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
import { of } from "rxjs";
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
    ]);
    mockMarkerService.markers = jasmine.createSpyObj("MarkerClusterGroup", [
      "clearLayers",
      "addLayer",
      "zoomToShowLayer",
    ]) as any;

    // Mock DataService
    mockDataService = jasmine.createSpyObj("DataService", [
      "getBeers",
      "getBeersAll",
    ]);
    mockDataService.getBeers.and.returnValue(of([]));
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
});
