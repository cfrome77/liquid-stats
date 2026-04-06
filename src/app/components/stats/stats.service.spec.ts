import { TestBed } from "@angular/core/testing";
import { StatsService } from "./stats.service";
import { BeerCheckin } from "src/app/core/models/beer.model";
import { DataService } from "src/app/core/services/data.service";
import { of } from "rxjs";

describe("StatsService", () => {
  let service: StatsService;
  let dataServiceSpy: jasmine.SpyObj<DataService>;

  beforeEach(() => {
    const spy = jasmine.createSpyObj("DataService", [
      "getBeers",
      "getBeersAll",
    ]);
    TestBed.configureTestingModule({
      providers: [StatsService, { provide: DataService, useValue: spy }],
    });
    service = TestBed.inject(StatsService);
    dataServiceSpy = TestBed.inject(DataService) as jasmine.SpyObj<DataService>;
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should memoize results", () => {
    const mockBeers: BeerCheckin[] = [
      {
        beer: {
          bid: 1,
          beer_name: "Beer 1",
          beer_style: "Style 1",
          beer_label: "",
          beer_abv: 5,
          beer_slug: "",
        },
        brewery: {
          brewery_id: 1,
          brewery_name: "Brewery 1",
          brewery_label: "",
          country_name: "USA",
          contact: {},
          location: { brewery_state: "CA", lat: 0, lng: 0 },
        },
        rating_score: 4,
        recent_created_at: "2023-01-01 12:00:00",
        first_created_at: "2023-01-01 12:00:00",
        count: 1,
      },
    ];
    const start = new Date("2023-01-01");
    const end = new Date("2023-12-31");

    const result1 = service.computeStats(mockBeers, start, end);
    const result2 = service.computeStats(mockBeers, start, end);

    expect(result1).toBe(result2); // Reference equality check for memoization
  });

  it("should recompute when beers change", () => {
    const mockBeers1: BeerCheckin[] = [];
    const mockBeers2: BeerCheckin[] = []; // Different reference
    const start = new Date("2023-01-01");
    const end = new Date("2023-12-31");

    const result1 = service.computeStats(mockBeers1, start, end);
    const result2 = service.computeStats(mockBeers2, start, end);

    expect(result1).not.toBe(result2);
  });

  it("should recompute when range changes", () => {
    const mockBeers: BeerCheckin[] = [];
    const start1 = new Date("2023-01-01");
    const end1 = new Date("2023-12-31");
    const start2 = new Date("2022-01-01");

    const result1 = service.computeStats(mockBeers, start1, end1);
    const result2 = service.computeStats(mockBeers, start2, end1);

    expect(result1).not.toBe(result2);
  });
});
