import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from "rxjs";

import { MarkerService } from "src/app/core/services/marker.service";
import { StatsComponent } from "./stats.component";
import { StatsService } from "./stats.service";
import { SharedTestingModule } from "../../testing/shared-testing.module";

describe("StatsComponent", () => {
  let component: StatsComponent;
  let fixture: ComponentFixture<StatsComponent>;
  let mockStatsService: any;

  beforeEach(async () => {
    mockStatsService = {
      loadBeerData: () => of([]),
      getDateRange: () => ({ start: new Date(), end: new Date() }),
      computeStats: () => ({
        totalUniqueBeers: 0,
        totalCheckins: 0,
        newBeersCount: 0,
        newBeerRatio: 0,
        averageRating: 0,
        totalUniqueBreweries: 0,
        beerStylesCount: {},
        topBeers: [],
        topCountries: {},
        topStates: {},
        recentActivityByDate: [],
        checkinsByHour: [],
        checkinsByDay: [],
        checkinsByDayOfWeek: [],
        checkinsByMonth: [],
        averageRatingsOverTime: [],
      }),
    };

    await TestBed.configureTestingModule({
  declarations: [StatsComponent],
  imports: [
    SharedTestingModule,
    HttpClientTestingModule,
  ],
  providers: [
    { provide: StatsService, useValue: mockStatsService }
  ],
}).compileComponents();

    fixture = TestBed.createComponent(StatsComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should load beer data and compute stats on init", () => {
    const mockBeers = [
      {
        beer: {
          bid: 1,
          beer_name: "Test IPA",
          beer_style: "IPA",
        },
        brewery: {
          brewery_name: "Test Brewery",
          country_name: "United States",
        },
        rating_score: 4.5,
        first_checkin_date: "2024-01-01",
      },
      {
        beer: {
          bid: 2,
          beer_name: "Test Stout",
          beer_style: "Stout",
        },
        brewery: {
          brewery_name: "Another Brewery",
          country_name: "Germany",
        },
        rating_score: 4.0,
        first_checkin_date: "2024-02-01",
      },
    ];

    spyOn(mockStatsService, "loadBeerData").and.returnValue(of(mockBeers));
    const computeSpy = spyOn(
      mockStatsService,
      "computeStats",
    ).and.callThrough();

    component.ngOnInit();

    expect(mockStatsService.loadBeerData).toHaveBeenCalled();
    expect(computeSpy).toHaveBeenCalledWith(
      mockBeers,
      jasmine.any(Date),
      jasmine.any(Date),
    );
  });
});
