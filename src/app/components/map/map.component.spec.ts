import { ComponentFixture, TestBed, fakeAsync, tick, flush } from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { ActivatedRoute } from "@angular/router";
import { of } from "rxjs";
import { MapComponent } from "./map.component";
import { MarkerService } from "../../core/services/marker.service";
import { MapService } from "../../core/services/map.service";

describe("MapComponent", () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;
  let mockMarkerService: any;
  let mockMapService: any;

  beforeEach(async () => {
    mockMarkerService = {
      makeBreweryMarkers: jasmine.createSpy("makeBreweryMarkers"),
      getMarkerByBreweryId: jasmine.createSpy("getMarkerByBreweryId"),
      markers: {
        zoomToShowLayer: jasmine.createSpy("zoomToShowLayer")
      }
    };

    mockMapService = {
      addMap: jasmine.createSpy("addMap"),
      removeMap: jasmine.createSpy("removeMap")
    };

    await TestBed.configureTestingModule({
      declarations: [MapComponent],
      imports: [HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: MarkerService, useValue: mockMarkerService },
        { provide: MapService, useValue: mockMapService },
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ mapId: "myMap" }),
            queryParams: of({})
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should initialize map on AfterViewInit", fakeAsync(() => {
    // We need a div with the mapId in the DOM for Leaflet to initialize
    const mapDiv = document.createElement('div');
    mapDiv.id = 'myMap';
    document.body.appendChild(mapDiv);

    fixture.detectChanges();
    component.ngAfterViewInit();
    tick(); // for setTimeout in ngAfterViewInit
    flush();

    expect(mockMarkerService.makeBreweryMarkers).toHaveBeenCalled();

    fixture.destroy();
    document.body.removeChild(mapDiv);
  }));
});
