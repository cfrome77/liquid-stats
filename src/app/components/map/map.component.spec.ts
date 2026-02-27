import {
  ComponentFixture,
  TestBed,
  fakeAsync,
  tick,
  flush
} from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { ActivatedRoute } from "@angular/router";
import { of } from "rxjs";
import { MapComponent } from "./map.component";
import { MarkerService } from "../../core/services/marker.service";
import { DataService } from "../../core/services/data.service";

describe("MapComponent", () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;
  let mockMarkerService: any;
  let mockDataService: any;

  beforeEach(async () => {
    mockMarkerService = jasmine.createSpyObj("MarkerService", ["makeBreweryMarkers"]);
    mockDataService = jasmine.createSpyObj("DataService", ["getBeers"]);
    mockDataService.getBeers.and.returnValue(of({
      response: {
        checkins: {
          items: []
        }
      }
    }));

    await TestBed.configureTestingModule({
      imports: [MapComponent, HttpClientTestingModule, RouterTestingModule],
      providers: [
        { provide: MarkerService, useValue: mockMarkerService },
        { provide: DataService, useValue: mockDataService },
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
    const mapDiv = document.createElement("div");
    mapDiv.id = "myMap";
    document.body.appendChild(mapDiv);

    fixture.detectChanges();
    tick();
    flush();

    expect(mockMarkerService.makeBreweryMarkers).toHaveBeenCalled();

    fixture.destroy();
    document.body.removeChild(mapDiv);
  }));
});
