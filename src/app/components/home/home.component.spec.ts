import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HomeComponent } from "./home.component";
import { RouterTestingModule } from "@angular/router/testing";
import { ActivatedRoute } from "@angular/router";
import { of } from "rxjs";
import { DataService } from "../../core/services/data.service";
import { BeerStoreService } from "../../core/services/beer-store.service";

describe("HomeComponent", () => {
  let component: HomeComponent;
  let fixture: ComponentFixture<HomeComponent>;
  let mockDataService: Partial<DataService>;
  let mockBeerStoreService: Partial<BeerStoreService>;

  beforeEach(async () => {
    mockDataService = {
      getBeers: () => of([]),
      getBeersAll: () => of([]),
      getStats: () => of({}),
      getCheckins: () => of({ response: { checkins: { items: [] } } }),
    };

    mockBeerStoreService = {
      load: () => {},
      beers$: of([]),
      checkins$: of([]),
      quickStats$: of({
        totalCheckins: 0,
        averageRating: 0,
        countriesTried: 0,
        breweriesVisited: 0,
      }),
      stats$: of({
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
      } as any),
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
});
