import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HomeComponent } from "./home.component";
import { RouterTestingModule } from "@angular/router/testing";
import { ActivatedRoute } from "@angular/router";
import { BehaviorSubject, of } from "rxjs";
import { DataService } from "../../core/services/data.service";
import { BeerStoreService } from "../../core/services/beer-store.service";
import { ProcessedStats, QuickStats } from "../../core/models/stats.model";
import { Checkin } from "../../core/models/checkin.model";

function makeCheckin(
  id: number,
  name: string,
  createdAt = "2026-01-01T00:00:00Z",
  overrides: Partial<Checkin["beer"]> = {},
): Checkin {
  return {
    checkin_id: id,
    created_at: createdAt,
    rating_score: 4.25,
    beer: { beer_name: name, beer_label: `label-${id}.png`, ...overrides },
    brewery: { brewery_name: `Brewery ${id}` },
    media: { items: [] },
  } as unknown as Checkin;
}

describe("HomeComponent", () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let checkinsSubject: BehaviorSubject<Checkin[] | null>;
  let quickStatsSubject: BehaviorSubject<QuickStats | null>;
  let statsSubject: BehaviorSubject<ProcessedStats | null>;

  beforeEach(async () => {
    checkinsSubject = new BehaviorSubject<Checkin[] | null>(null);
    quickStatsSubject = new BehaviorSubject<QuickStats | null>(null);
    statsSubject = new BehaviorSubject<ProcessedStats | null>(null);

    const mockDataService: Partial<DataService> = {
      getBeersAll: () => of([]),
      getStats: () => of({} as QuickStats),
      getCheckins: () => of({ response: { checkins: { items: [] } } }),
    };

    const mockBeerStoreService: Partial<BeerStoreService> = {
      load: () => {},
      checkins$: checkinsSubject.asObservable(),
      quickStats$: quickStatsSubject.asObservable(),
      stats$: statsSubject.asObservable(),
    };

    await TestBed.configureTestingModule({
      imports: [HomeComponent, RouterTestingModule],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({}) } },
        { provide: DataService, useValue: mockDataService },
        { provide: BeerStoreService, useValue: mockBeerStoreService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("renders a carousel card per check-in", () => {
    checkinsSubject.next([makeCheckin(1, "Hazy IPA"), makeCheckin(2, "Stout")]);
    fixture.detectChanges();

    const cards = fixture.nativeElement.querySelectorAll(
      ".carousel-track .beer-card",
    ) as NodeListOf<HTMLElement>;
    expect(cards.length).toBe(2);
    expect(cards[0]!.textContent).toContain("Hazy IPA");
    expect(cards[1]!.textContent).toContain("Stout");
    expect(component.allCheckins().length).toBe(2);
  });

  it("caps the carousel to the most recent check-ins, newest first", () => {
    const checkins = Array.from({ length: 20 }, (_, i) =>
      makeCheckin(
        i + 1,
        `Beer ${i + 1}`,
        `2026-01-${String(i + 1).padStart(2, "0")}T00:00:00Z`,
      ),
    );
    checkinsSubject.next(checkins);
    fixture.detectChanges();

    expect(component.allCheckins().length).toBe(20);
    expect(component.recentCheckins().length).toBe(12);
    // newest first: the last item in the source array
    expect(component.recentCheckins()[0]!.checkin_id).toBe(20);
    expect(component.recentCheckins()[11]!.checkin_id).toBe(9);

    const cards = fixture.nativeElement.querySelectorAll(
      ".carousel-track .beer-card",
    ) as NodeListOf<HTMLElement>;
    expect(cards.length).toBe(12);
  });

  it("derives the quick stats from the store streams", () => {
    quickStatsSubject.next({
      totalCheckins: 42,
      averageRating: 3.8,
      countriesTried: 5,
      breweriesVisited: 9,
      lastUpdated: "2026-02-19T12:00:00Z",
    });
    statsSubject.next({
      totalUniqueBeers: 30,
      totalCheckins: 42,
      newBeersCount: 10,
      newBeerRatio: 0.3,
      averageRating: 3.8,
      totalUniqueBreweries: 12,
      beerStylesCount: {},
      topBeers: [],
      topCountries: { US: 20, BE: 5 },
      topStates: {},
      recentActivityByDate: [],
      checkinsByHour: [],
      checkinsByDay: [],
      checkinsByDayOfWeek: [],
      checkinsByMonth: [],
      averageRatingsOverTime: [],
    });
    fixture.detectChanges();

    expect(component.totalCheckins()).toBe(42);
    expect(component.averageRating()).toBe(3.8);
    // countries come from the count of topCountries keys
    expect(component.countriesTried()).toBe(2);
    expect(component.breweriesVisited()).toBe(12);
  });

  it("scrolls the carousel forward and backward by 80% of the track width", () => {
    const scrollBy = jasmine.createSpy("scrollBy");
    component.carouselTrack = {
      nativeElement: { clientWidth: 1000, scrollBy },
    } as unknown as typeof component.carouselTrack;

    component.scrollNext();
    expect(scrollBy).toHaveBeenCalledWith({ left: 800, behavior: "smooth" });

    component.scrollPrev();
    expect(scrollBy).toHaveBeenCalledWith({ left: -800, behavior: "smooth" });
  });

  it("eagerly loads the leading carousel images and lazily loads the rest", () => {
    const checkins = Array.from({ length: 8 }, (_, i) =>
      makeCheckin(i + 1, `Beer ${i + 1}`),
    );
    checkinsSubject.next(checkins);
    fixture.detectChanges();

    const imgs = Array.from(
      fixture.nativeElement.querySelectorAll(
        ".carousel-track .beer-card img",
      ) as NodeListOf<HTMLImageElement>,
    );
    expect(imgs.length).toBe(8);
    expect(imgs.slice(0, 4).map((img) => img.getAttribute("loading"))).toEqual([
      "eager",
      "eager",
      "eager",
      "eager",
    ]);
    expect(
      imgs.slice(4).every((img) => img.getAttribute("loading") === "lazy"),
    ).toBeTrue();
    expect(imgs[0]!.getAttribute("fetchpriority")).toBe("high");
    expect(imgs[7]!.getAttribute("fetchpriority")).toBe("low");
  });

  it("falls back to the default image when a card image fails to load", () => {
    const img = document.createElement("img");
    component.handleImageError({ target: img } as unknown as Event);
    expect(img.getAttribute("src")).toBe("assets/images/beer-placeholder.svg");
  });

  it("retries the standard label before the placeholder when the HD variant fails", () => {
    const img = document.createElement("img");
    img.setAttribute(
      "src",
      "https://assets.untappd.com/site/beer_logos_hd/beer-1_hd.jpeg",
    );

    component.handleImageError(
      { target: img } as unknown as Event,
      "small.jpeg",
    );
    expect(img.getAttribute("src")).toBe("small.jpeg");

    // The standard label failed too, so now it may drop to the placeholder.
    component.handleImageError(
      { target: img } as unknown as Event,
      "small.jpeg",
    );
    expect(img.getAttribute("src")).toBe("assets/images/beer-placeholder.svg");
  });

  it("falls back from a broken photo_url to the HD label, then the standard label, then the placeholder", () => {
    const img = document.createElement("img");
    const photoUrl = "https://assets.untappd.com/site/photo/1_sm.jpg";
    const hdLabel =
      "https://assets.untappd.com/site/beer_logos_hd/beer-1_hd.jpeg";
    const label = "https://assets.untappd.com/site/beer_logos/beer-1_sm.jpeg";
    img.setAttribute("src", photoUrl);

    component.handleImageError(
      { target: img } as unknown as Event,
      hdLabel,
      label,
    );
    expect(img.getAttribute("src")).toBe(hdLabel);

    component.handleImageError(
      { target: img } as unknown as Event,
      hdLabel,
      label,
    );
    expect(img.getAttribute("src")).toBe(label);

    component.handleImageError(
      { target: img } as unknown as Event,
      hdLabel,
      label,
    );
    expect(img.getAttribute("src")).toBe("assets/images/beer-placeholder.svg");
  });

  it("skips missing or duplicate candidates instead of looping on a broken photo_url", () => {
    const img = document.createElement("img");
    const label = "https://assets.untappd.com/site/beer_logos/beer-1_sm.jpeg";
    img.setAttribute("src", "https://assets.untappd.com/site/photo/1_sm.jpg");

    // No HD label: the chain steps straight to the standard label.
    component.handleImageError(
      { target: img } as unknown as Event,
      undefined,
      label,
    );
    expect(img.getAttribute("src")).toBe(label);

    // Every candidate matches the current src, so it stops at the placeholder.
    component.handleImageError(
      { target: img } as unknown as Event,
      label,
      label,
    );
    expect(img.getAttribute("src")).toBe("assets/images/beer-placeholder.svg");

    // The placeholder itself failing must not re-assign the same src.
    component.handleImageError(
      { target: img } as unknown as Event,
      undefined,
      label,
    );
    expect(img.getAttribute("src")).toBe("assets/images/beer-placeholder.svg");
  });

  it("walks a rendered carousel image from photo_url down to the beer labels", () => {
    const photo = "https://assets.untappd.com/site/photo/1_sm.jpg";
    const hd = "https://assets.untappd.com/site/beer_logos_hd/beer-1_hd.jpeg";
    const checkin = makeCheckin(1, "Hazy IPA", undefined, {
      beer_label: "https://assets.untappd.com/site/beer_logos/beer-1_sm.jpeg",
      beer_label_hd: hd,
    });
    (checkin as { media: Checkin["media"] }).media = {
      count: 1,
      items: [
        {
          photo: {
            photo_img_sm: photo,
            photo_img_md: photo,
            photo_img_lg: photo,
            photo_img_og: photo,
          },
        },
      ],
    };
    checkinsSubject.next([checkin]);
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector(
      ".carousel-track .beer-card img",
    ) as HTMLImageElement;
    expect(img.getAttribute("src")).toBe(photo);

    img.dispatchEvent(new Event("error"));
    expect(img.getAttribute("src")).toBe(hd);

    img.dispatchEvent(new Event("error"));
    expect(img.getAttribute("src")).toBe(
      "https://assets.untappd.com/site/beer_logos/beer-1_sm.jpeg",
    );

    img.dispatchEvent(new Event("error"));
    expect(img.getAttribute("src")).toBe("assets/images/beer-placeholder.svg");
  });

  it("does not loop when the placeholder is passed as an explicit candidate", () => {
    const img = document.createElement("img");
    img.src = component.DEFAULT_IMAGE;
    const before = img.getAttribute("src");
    component.handleImageError(
      { target: img } as unknown as Event,
      component.DEFAULT_IMAGE,
    );
    expect(img.getAttribute("src")).toBe(before);
  });

  it("does not re-assign the placeholder on repeated image errors", () => {
    const img = document.createElement("img");
    img.src = component.DEFAULT_IMAGE;
    const before = img.getAttribute("src");
    component.handleImageError({ target: img } as unknown as Event);
    expect(img.getAttribute("src")).toBe(before);
  });
});
