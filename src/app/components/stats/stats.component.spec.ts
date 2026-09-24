import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import {
  MatDialogModule,
  MatDialogRef,
  MatDialog,
} from "@angular/material/dialog";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

import { StatsComponent } from "./stats.component";
import { StatsService } from "./stats.service";
import { BeerCheckin } from "src/app/core/models/beer.model";
import { GenericBeersDialogData } from "src/app/shared/components/beer-style-dialog/beer-style-dialog.component";

describe("StatsComponent", () => {
  let component: StatsComponent;
  let fixture: ComponentFixture<StatsComponent>;
  let mockStatsService: jasmine.SpyObj<StatsService>;
  let dialogSpy: jasmine.Spy;

  beforeEach(async () => {
    mockStatsService = jasmine.createSpyObj("StatsService", [
      "computeStats",
      "getBeerCountInRange",
    ]);
    mockStatsService.computeStats.and.returnValue({
      totalUniqueBeers: 0,
      totalCheckins: 0,
      newBeersCount: 0,
      newBeerRatio: 0,
      averageRating: 0,
      totalUniqueBreweries: 0,
      beerStylesCount: { "IPA - Rye": 1 },
      topBeers: [],
      topCountries: {},
      topStates: {},
      recentActivityByDate: [],
      checkinsByHour: [],
      checkinsByDay: [],
      checkinsByDayOfWeek: [],
      checkinsByMonth: [],
      averageRatingsOverTime: [],
    });
    mockStatsService.getBeerCountInRange.and.returnValue(1);

    const mockDialogRef = {
      afterClosed: () => ({ subscribe: () => {} }),
      close: () => {},
    } as unknown as MatDialogRef<unknown>;

    dialogSpy = spyOn(MatDialog.prototype, "open").and.returnValue(
      mockDialogRef,
    );

    await TestBed.configureTestingModule({
      imports: [
        StatsComponent,
        ReactiveFormsModule,
        HttpClientTestingModule,
        MatDialogModule,
        BrowserAnimationsModule,
      ],
      providers: [{ provide: StatsService, useValue: mockStatsService }],
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

  it("should open style dialog with filtered beers in date range", () => {
    const testBeer: BeerCheckin = {
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
    component.beers = [testBeer];

    component.openBeersByStyle("IPA - Rye");

    expect(mockStatsService.getBeerCountInRange).toHaveBeenCalled();
    expect(dialogSpy).toHaveBeenCalled();

    const dialogData = dialogSpy.calls.mostRecent().args[1]
      ?.data as GenericBeersDialogData;
    expect(dialogData.title).toBe("IPA - Rye");
    expect(dialogData.beers.length).toBe(1);
    expect(dialogData.beers[0].beerName).toBe("Riversong");
    expect(dialogData.beers[0].checkInDate).toBe("2026-09-19 20:38:00");
  });
});
