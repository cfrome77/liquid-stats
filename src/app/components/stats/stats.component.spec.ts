import { ComponentFixture, TestBed } from "@angular/core/testing";
import { ReactiveFormsModule } from "@angular/forms";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogModule } from "@angular/material/dialog";
import { MatCardModule } from "@angular/material/card";
import { MatSelectModule } from "@angular/material/select";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { of } from "rxjs";
import { By } from "@angular/platform-browser";

import { StatsComponent } from "./stats.component";
import { StatsService } from "./stats.service";
import { ThemeService } from "src/app/core/services/theme.service";
import { BaseChartDirective, provideCharts, withDefaultRegisterables } from "ng2-charts";
import { Component, Input } from "@angular/core";

// Mock child components
@Component({
  selector: "app-powered-by",
  template: "",
  standalone: false,
})
class MockPoweredByComponent {}

describe("StatsComponent", () => {
  let component: StatsComponent;
  let fixture: ComponentFixture<StatsComponent>;
  let mockStatsService: any;
  let mockThemeService: any;

  const mockStats = {
    totalUniqueBeers: 10,
    totalCheckins: 20,
    newBeersCount: 5,
    newBeerRatio: 0.5,
    averageRating: 4.2,
    totalUniqueBreweries: 8,
    beerStylesCount: { "IPA": 5, "Stout": 3 },
    topBeers: [{ name: "Beer 1", count: 3, avgRating: 4.5 }],
    topCountries: { "USA": 15 },
    topStates: { "California": 10 },
    recentActivityByDate: [{ date: "2024-01-01", count: 2 }],
    checkinsByHour: new Array(24).fill(0),
    checkinsByDayOfWeek: [{ day: "Monday", count: 5 }],
    checkinsByMonth: [{ month: "Jan", count: 10 }],
    averageRatingsOverTime: [{ date: "2024-01-01", rating: 4.0 }],
  };

  beforeEach(async () => {
    mockStatsService = {
      loadBeerData: () => of([{ beer: { bid: 1 }, recent_created_at: '2024-01-01' }]),
      computeStats: () => mockStats,
    };

    mockThemeService = {
      theme$: of("light-theme"),
    };

    await TestBed.configureTestingModule({
      declarations: [StatsComponent, MockPoweredByComponent],
      imports: [
        ReactiveFormsModule,
        HttpClientTestingModule,
        MatDialogModule,
        MatCardModule,
        MatSelectModule,
        MatFormFieldModule,
        MatInputModule,
        BrowserAnimationsModule,
        BaseChartDirective,
      ],
      providers: [
        { provide: StatsService, useValue: mockStatsService },
        { provide: ThemeService, useValue: mockThemeService },
        provideCharts(withDefaultRegisterables()),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StatsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should display summary cards when data is available", () => {
    const cards = fixture.debugElement.queryAll(By.css(".summary-card"));
    expect(cards.length).toBe(6);

    const firstCardValue = cards[0].query(By.css(".summary-value")).nativeElement.textContent;
    expect(firstCardValue).toContain("10");
  });

  it("should display breakdown cards", () => {
    const breakdownCards = fixture.debugElement.queryAll(By.css(".breakdown-card"));
    expect(breakdownCards.length).toBeGreaterThan(0);
  });

  it("should call onDateChange on dateRange change", () => {
    spyOn(component, "onDateChange");
    component.dateRange.setValue("month");
    expect(component.onDateChange).toHaveBeenCalled();
  });
});
