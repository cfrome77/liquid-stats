import { TestBed } from "@angular/core/testing";
import {
  HttpClientTestingModule,
  HttpTestingController,
} from "@angular/common/http/testing";
import { DataService } from "./data.service";
import { Badge } from "../models/badge.model";
import { CheckinResponse } from "../models/checkin.model";

describe("DataService", () => {
  let service: DataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DataService],
    });
    service = TestBed.inject(DataService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should fetch badges and cache the result", () => {
    const mockBadges: Badge[] = [
      {
        user_badge_id: 10,
        badge_name: "Test Badge",
        badge_description: "Badge desc",
        badge_hint: "Badge hint",
        badge_image: {
          sm: "https://untappd.s3.amazonaws.com/badges/bdg_1_sm.jpeg",
          md: "https://untappd.s3.amazonaws.com/badges/bdg_1_md.jpeg",
          lg: "https://untappd.s3.amazonaws.com/badges/bdg_1_lg.jpeg",
        },
        media: {
          badge_image_sm:
            "https://untappd.s3.amazonaws.com/badges/bdg_1_sm.jpeg",
        },
        earned_at: "2026-01-01",
      },
    ];

    let result1: Badge[] | undefined;
    let result2: Badge[] | undefined;

    service.getBadges().subscribe((res) => (result1 = res));
    const req = httpMock.expectOne((r) => r.url.endsWith("badges.json"));
    expect(req.request.method).toBe("GET");
    req.flush(mockBadges);

    expect(result1).toEqual(mockBadges);

    // Second request should hit cache and not issue another HTTP request
    service.getBadges().subscribe((res) => (result2 = res));
    httpMock.expectNone((r) => r.url.endsWith("badges.json"));
    expect(result2).toEqual(mockBadges);
  });

  it("should fetch beers_all and transform HD / sanitized URLs", () => {
    const mockRawBeers = {
      beers: [
        {
          count: 5,
          rating_score: 4.5,
          beer: {
            bid: 123,
            beer_name: "IPA Test",
            beer_label:
              "https://assets.untappd.com/site/beer_logos/beer-123_sm.jpeg",
          },
          brewery: {
            brewery_id: 456,
            brewery_name: "Test Brewery",
            brewery_label:
              "https://assets.untappd.com/site/brewery_logos/brewery-456_sm.jpeg",
          },
        },
      ],
    };

    let transformedBeers: unknown;
    service.getBeersAll().subscribe((res) => (transformedBeers = res));

    const req = httpMock.expectOne((r) => r.url.endsWith("beers_all.json"));
    req.flush(mockRawBeers);

    expect(transformedBeers).toBeDefined();
    const beers = transformedBeers as Array<{
      beer: { beer_label: string; beer_label_hd: string };
      brewery: { brewery_label: string; brewery_label_hd: string };
    }>;

    expect(beers.length).toBe(1);
    expect(beers[0].beer.beer_label_hd).toContain("beer_logos_hd");
    expect(beers[0].brewery.brewery_label_hd).toContain("brewery_logos_hd");
  });

  it("should clear cache when clearCache() is called", () => {
    let res1: unknown;
    let res2: unknown;

    service.getStats().subscribe((val) => (res1 = val));
    const req1 = httpMock.expectOne((r) => r.url.endsWith("stats.json"));
    req1.flush({ totalCheckins: 100 });
    expect(res1).toEqual({ totalCheckins: 100 });

    service.clearCache();

    service.getStats().subscribe((val) => (res2 = val));
    const req2 = httpMock.expectOne((r) => r.url.endsWith("stats.json"));
    req2.flush({ totalCheckins: 105 });
    expect(res2).toEqual({ totalCheckins: 105 });
  });

  it("should fetch checkins and transform beer/brewery labels", () => {
    const mockCheckinsResponse: CheckinResponse = {
      response: {
        checkins: {
          items: [
            {
              checkin_id: 999,
              created_at: "2026-02-01",
              checkin_comment: "Tasty beer",
              rating_score: 4,
              beer: {
                bid: 10,
                beer_name: "Stout",
                beer_style: "Imperial Stout",
                beer_slug: "stout",
                beer_label:
                  "https://assets.untappd.com/site/beer_logos/beer-10_sm.jpeg",
              },
              brewery: {
                brewery_id: 20,
                brewery_name: "Dark Brewery",
                country_name: "USA",
                brewery_label:
                  "https://assets.untappd.com/site/brewery_logos/brewery-20_sm.jpeg",
              },
            },
          ],
        },
      },
    };

    let result: CheckinResponse | undefined;
    service.getCheckins().subscribe((res) => (result = res));

    const req = httpMock.expectOne((r) => r.url.endsWith("checkins.json"));
    req.flush(mockCheckinsResponse);

    expect(result).toBeDefined();
    const item = result?.response?.checkins?.items?.[0];
    expect(item?.beer?.beer_label_hd).toContain("beer_logos_hd");
    expect(item?.brewery?.brewery_label_hd).toContain("brewery_logos_hd");
  });
});
