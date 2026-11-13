import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HomeComponent } from "./home.component";
import { RouterTestingModule } from "@angular/router/testing";
import { ActivatedRoute } from "@angular/router";
import { BehaviorSubject, of } from "rxjs";
import { DataService } from "../../core/services/data.service";
import {
  BeerStoreService,
  QuickStats,
} from "../../core/services/beer-store.service";
import { ProcessedStats } from "../../core/models/stats.model";
import { Checkin } from "../../core/models/checkin.model";

function makeCheckin(
  id: number,
  name: string,
  createdAt = "2026-01-01T00:00:00Z",
): Checkin {
  return {
    checkin_id: id,
    created_at: createdAt,
    rating_score: 4.25,
    beer: { beer_name: name, beer_label: `label-${id}.png` },
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
      getStats: () => of({}),
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
    expect(cards[0].textContent).toContain("Hazy IPA");
    expect(cards[1].textContent).toContain("Stout");
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
    expect(component.recentCheckins()[0].checkin_id).toBe(20);
    expect(component.recentCheckins()[11].checkin_id).toBe(9);

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
    expect(imgs[0].getAttribute("fetchpriority")).toBe("high");
    expect(imgs[7].getAttribute("fetchpriority")).toBe("low");
  });

  it("falls back to the default image when a card image fails to load", () => {
    const img = document.createElement("img");
    component.handleImageError({ target: img } as unknown as Event);
    expect(img.src).toContain("placehold.co");
  });

  it("does not re-assign the placeholder on repeated image errors", () => {
    const img = document.createElement("img");
    img.src = component.DEFAULT_IMAGE;
    const before = img.src;
    component.handleImageError({ target: img } as unknown as Event);
    expect(img.src).toBe(before);
  });
});
