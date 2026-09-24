import { TestBed } from "@angular/core/testing";
import { StatsService } from "./stats.service";
import { BeerCheckin } from "src/app/core/models/beer.model";
import { DataService } from "src/app/core/services/data.service";

describe("StatsService", () => {
  let service: StatsService;

  beforeEach(() => {
    const spy = jasmine.createSpyObj("DataService", [
      "getBeers",
      "getBeersAll",
    ]);
    TestBed.configureTestingModule({
      providers: [StatsService, { provide: DataService, useValue: spy }],
    });
    service = TestBed.inject(StatsService);
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
        recent_checkin_id: 1234,
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

  it("should safely handle null/undefined ratings and missing fields", () => {
    const mockBeers: BeerCheckin[] = [
      {
        beer: {
          bid: 1,
          beer_name: undefined as unknown as string,
          beer_style: undefined as unknown as string,
          beer_label: "",
          beer_abv: 5,
          beer_slug: "",
        },
        brewery: {
          brewery_id: 1,
          brewery_name: undefined as unknown as string,
          brewery_label: "",
          country_name: undefined as unknown as string,
          contact: {},
          location: {
            brewery_state: undefined as unknown as string,
            lat: 0,
            lng: 0,
          },
        },
        rating_score: undefined as unknown as number,
        recent_checkin_id: 1234,
        recent_created_at: "2023-01-01 12:00:00",
        first_created_at: "2023-01-01 12:00:00",
        count: undefined as unknown as number,
      },
    ];
    const start = new Date("2023-01-01");
    const end = new Date("2023-12-31");

    const stats = service.computeStats(mockBeers, start, end);

    expect(stats.totalCheckins).toBe(1);
    expect(stats.averageRating).toBe(0);
    expect(isNaN(stats.averageRating)).toBeFalse();
    expect(stats.beerStylesCount["Unknown"]).toBe(1);
    expect(stats.topCountries["Unknown"]).toBe(1);
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

  describe("getBeerCountInRange", () => {
    const start = new Date("2026-09-17T00:00:00Z");
    const end = new Date("2026-09-24T23:59:59Z");

    it("should return 0 when neither first nor recent date falls in range", () => {
      const beer: BeerCheckin = {
        beer: {
          bid: 1,
          beer_name: "Beer 1",
          beer_style: "IPA",
          beer_label: "",
          beer_abv: 5,
          beer_slug: "",
        },
        brewery: {
          brewery_id: 1,
          brewery_name: "Brewery 1",
          country_name: "USA",
          location: {},
        },
        rating_score: 4,
        recent_created_at: "2026-01-01 12:00:00",
        first_created_at: "2026-01-01 12:00:00",
        count: 5,
      };
      expect(service.getBeerCountInRange(beer, start, end)).toBe(0);
    });

    it("should return 1 when recent date is in range but first date is before range", () => {
      const beer: BeerCheckin = {
        beer: {
          bid: 1,
          beer_name: "Riversong",
          beer_style: "IPA - Rye",
          beer_label: "",
          beer_abv: 8.5,
          beer_slug: "",
        },
        brewery: {
          brewery_id: 1,
          brewery_name: "Sandbox",
          country_name: "USA",
          location: {},
        },
        rating_score: 4,
        recent_created_at: "2026-09-19 20:38:00",
        first_created_at: "2024-05-10 12:00:00",
        count: 2,
      };
      expect(service.getBeerCountInRange(beer, start, end)).toBe(1);
    });

    it("should return total count when both first date and recent date fall in range", () => {
      const beer: BeerCheckin = {
        beer: {
          bid: 1,
          beer_name: "Riversong",
          beer_style: "IPA - Rye",
          beer_label: "",
          beer_abv: 8.5,
          beer_slug: "",
        },
        brewery: {
          brewery_id: 1,
          brewery_name: "Sandbox",
          country_name: "USA",
          location: {},
        },
        rating_score: 4,
        recent_created_at: "2026-09-20 20:38:00",
        first_created_at: "2026-09-18 12:00:00",
        count: 2,
      };
      expect(service.getBeerCountInRange(beer, start, end)).toBe(2);
    });
  });

  it("should calculate style counts using only in-range checkins", () => {
    const start = new Date("2026-09-17T00:00:00Z");
    const end = new Date("2026-09-24T23:59:59Z");

    const mockBeers: BeerCheckin[] = [
      {
        beer: {
          bid: 1,
          beer_name: "Riversong",
          beer_style: "IPA - Rye",
          beer_label: "",
          beer_abv: 8.5,
          beer_slug: "",
        },
        brewery: {
          brewery_id: 1,
          brewery_name: "Sandbox",
          country_name: "USA",
          location: {},
        },
        rating_score: 4,
        recent_created_at: "2026-09-19 20:38:00",
        first_created_at: "2024-05-10 12:00:00",
        count: 2, // Total count is 2 all-time, but only 1 checkin last week
      },
    ];

    const stats = service.computeStats(mockBeers, start, end);

    expect(stats.totalCheckins).toBe(1);
    expect(stats.beerStylesCount["IPA - Rye"]).toBe(1);
  });
});
