import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogModule } from "@angular/material/dialog";
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
      getDateRange: () => ({ start: new Date(), end: new Date() }),
      computeStats: () => ({
        total: 0,
        uniqueBeers: 0,
        averageRating: 0,
        newBeerRatio: 0,
        beersPerDay: 0,
        totalVenues: 0,
        uniqueVenues: 0,
        newVenueRatio: 0,
      }),
    };

    await TestBed.configureTestingModule({
      declarations: [StatsComponent],
      imports: [ReactiveFormsModule, HttpClientTestingModule, MatDialogModule],
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
});
