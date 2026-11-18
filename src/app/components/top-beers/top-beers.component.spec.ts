import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TopBeersComponent } from "./top-beers.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatSelectModule } from "@angular/material/select";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { MatRadioModule } from "@angular/material/radio";
import {
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { of, throwError } from "rxjs";
import { DataService } from "../../core/services/data.service";
import { ActivatedRoute, Router } from "@angular/router";
import { RouterTestingModule } from "@angular/router/testing";

describe("TopBeersComponent", () => {
  let component: TopBeersComponent;
  let fixture: ComponentFixture<TopBeersComponent>;
  let mockDataService: jasmine.SpyObj<DataService>;

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj("DataService", ["getBeersAll"]);
    const mockBeer = {
      beer: {
        beer_name: "Test Beer",
        beer_style: "IPA",
        beer_slug: "test-ipa",
        bid: 123,
        beer_label: "",
        beer_abv: 5.0,
      },
      brewery: {
        brewery_name: "Test Brewery",
        brewery_label: "",
        brewery_id: 456,
        contact: { twitter: "test" },
        location: { brewery_state: "CA", lat: 0, lng: 0 },
        country_name: "USA",
      },
      rating_score: 4.5,
      recent_created_at: "2026-02-07",
      first_created_at: "2026-02-07",
    };
    mockDataService.getBeersAll.and.returnValue(of([mockBeer]));

    await TestBed.configureTestingModule({
      imports: [
        TopBeersComponent,
        HttpClientTestingModule,
        MatSelectModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatRadioModule,
        MatDialogModule,
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        RouterTestingModule,
      ],
      providers: [
        { provide: DataService, useValue: mockDataService },
        {
          provide: ActivatedRoute,
          useValue: {
            params: of({}),
            snapshot: {
              queryParamMap: {
                get: () => null,
              },
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TopBeersComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it("should filter beers", () => {
    fixture.detectChanges();
    expect(component.transformedTopBeers.length).toBeGreaterThan(0);
    expect(component.transformedTopBeers[0]!.title).toBe("Test Beer");
  });

  it("shows a retryable error state when the beers request fails", () => {
    mockDataService.getBeersAll.and.returnValue(
      throwError(() => new Error("network error")),
    );
    mockDataService.clearCache = jasmine.createSpy("clearCache");

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.hasLoadError()).toBeTrue();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain("couldn't load your drinks");

    const button = el.querySelector(
      "app-empty-state button",
    ) as HTMLButtonElement;
    button.click();
    expect(mockDataService.clearCache).toHaveBeenCalled();
  });

  it("should correctly handle beers with count > 1 for minCheckins filter", () => {
    const multiCheckinBeer = {
      beer: {
        beer_name: "Multi Beer",
        beer_style: "Stout",
        bid: 789,
        beer_slug: "multi-beer",
        beer_label: "",
        beer_abv: 8.0,
      },
      brewery: {
        brewery_name: "Multi Brewery",
        location: { brewery_state: "CA", lat: 0, lng: 0 },
        brewery_label: "",
        contact: {},
        country_name: "USA",
      },
      rating_score: 4.0,
      count: 3,
      recent_created_at: "2026-02-07",
      first_created_at: "2026-02-07",
    };
    mockDataService.getBeersAll.and.returnValue(of([multiCheckinBeer]));

    component.ngOnInit();
    component.minCheckins = 3;
    component.onFilterChange();
    fixture.detectChanges();

    expect(component.transformedTopBeers.length).toBe(1);
    expect(component.transformedTopBeers[0]!.title).toBe("Multi Beer");

    component.minCheckins = 5;
    component.onFilterChange();
    fixture.detectChanges();
    expect(component.transformedTopBeers.length).toBe(0);
  });

  describe("URL state", () => {
    async function initAt(query: Record<string, string>): Promise<Router> {
      await TestBed.resetTestingModule();
      mockDataService = jasmine.createSpyObj("DataService", ["getBeersAll"]);
      mockDataService.getBeersAll.and.returnValue(of([]));

      await TestBed.configureTestingModule({
        imports: [TopBeersComponent, RouterTestingModule],
        providers: [
          { provide: DataService, useValue: mockDataService },
          {
            provide: ActivatedRoute,
            useValue: {
              params: of({}),
              snapshot: {
                queryParamMap: { get: (k: string) => query[k] ?? null },
              },
            },
          },
        ],
      }).compileComponents();

      const router = TestBed.inject(Router);
      fixture = TestBed.createComponent(TopBeersComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      return router;
    }

    it("restores ranking filters from the URL", async () => {
      await initAt({ range: "Last Month", topX: "10", min: "3" });

      expect(component.selectedRange.label).toBe("Last Month");
      expect(component.topX).toBe(10);
      expect(component.minCheckins).toBe(3);
    });

    it("falls back to defaults for values outside the allowed sets", async () => {
      await initAt({ range: "Nonsense", topX: "999", min: "0" });

      expect(component.selectedRange).toBe(component.dateRangeOptions[0]!);
      expect(component.topX).toBe(5);
      expect(component.minCheckins).toBe(1);
    });

    it("writes a changed filter back to the URL", async () => {
      const router = await initAt({});
      const navigate = spyOn(router, "navigate");

      component.topX = 15;
      component.onFilterChange();

      const queryParams = navigate.calls.mostRecent().args[1]!
        .queryParams as Record<string, string | null>;
      expect(queryParams["topX"]).toBe("15");
    });
  });

  it("should not auto-focus the search input when the style dialog opens", () => {
    const dialogSpy = spyOn(MatDialog.prototype, "open").and.returnValue({
      afterClosed: () => of(undefined),
      close: () => {},
    } as unknown as MatDialogRef<unknown>);

    component.openStyleDialog("IPA");

    expect(dialogSpy.calls.mostRecent().args[1]?.autoFocus).toBeFalse();
  });

  it("resets filters back to their defaults", () => {
    fixture.detectChanges();
    component.topX = 15;
    component.minCheckins = 10;
    component.selectedRange = component.dateRangeOptions[2]!;
    component.useCustomDate = true;
    component.customStartDate = new Date();

    component.resetFilters();

    expect(component.topX).toBe(5);
    expect(component.minCheckins).toBe(1);
    expect(component.selectedRange).toBe(component.dateRangeOptions[0]!);
    expect(component.useCustomDate).toBeFalse();
    expect(component.customStartDate).toBeNull();
    expect(component.transformedTopBeers.length).toBeGreaterThan(0);
  });
});
