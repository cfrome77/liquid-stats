import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogModule } from "@angular/material/dialog";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { of } from "rxjs";

import { StatsComponent } from "./stats.component";
import { StatsService } from "./stats.service";

describe("StatsComponent", () => {
  let component: StatsComponent;
  let fixture: ComponentFixture<StatsComponent>;
  let mockStatsService: any;

  beforeEach(async () => {
    mockStatsService = {
      loadBeerData: () => of([]),
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
        averageRatingsOverTime: []
    })
    };

    await TestBed.configureTestingModule({
      imports: [
        StatsComponent,
        ReactiveFormsModule,
        HttpClientTestingModule,
        MatDialogModule,
        BrowserAnimationsModule
      ],
      providers: [{ provide: StatsService, useValue: mockStatsService }]
    }).compileComponents();

    fixture = TestBed.createComponent(StatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should call onDateChange on dateRange change", () => {
    spyOn(component, "onDateChange");
    component.dateRange.setValue("month");
    expect(component.onDateChange).toHaveBeenCalled();
  });
});
