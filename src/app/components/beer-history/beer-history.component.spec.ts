import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { MatDialogModule } from "@angular/material/dialog";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { of } from "rxjs";

import { BeerHistoryComponent } from "./beer-history.component";
import { DataService } from "src/app/core/services/data.service";
import { BeerCheckin } from "src/app/core/models/beer.model";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";

function makeBeer(overrides: {
  name: string;
  style: string;
  brewery: string;
  country: string;
  state?: string;
  rating: number;
  date: string;
}): BeerCheckin {
  return {
    beer: {
      bid: Math.floor(Math.random() * 1e6),
      beer_abv: 5,
      beer_label: "",
      beer_name: overrides.name,
      beer_style: overrides.style,
    },
    brewery: {
      brewery_id: Math.floor(Math.random() * 1e6),
      brewery_name: overrides.brewery,
      country_name: overrides.country,
      location: { brewery_state: overrides.state },
    },
    rating_score: overrides.rating,
    first_created_at: overrides.date,
    recent_created_at: overrides.date,
    recent_checkin_id: Math.floor(Math.random() * 1e6),
  };
}

const sampleBeers: BeerCheckin[] = [
  makeBeer({
    name: "Hazy IPA",
    style: "IPA - New England",
    brewery: "Alpha Brewing",
    country: "United States",
    state: "California",
    rating: 4.25,
    date: "2026-03-01 12:00:00",
  }),
  makeBeer({
    name: "West Coast IPA",
    style: "IPA - American",
    brewery: "Alpha Brewing",
    country: "United States",
    state: "California",
    rating: 3.75,
    date: "2026-04-01 12:00:00",
  }),
  makeBeer({
    name: "Dry Stout",
    style: "Stout - Irish Dry",
    brewery: "Beta Brewing",
    country: "Ireland",
    state: "Dublin",
    rating: 4.5,
    date: "2026-05-01 12:00:00",
  }),
];

describe("BeerHistoryComponent", () => {
  let component: BeerHistoryComponent;
  let fixture: ComponentFixture<BeerHistoryComponent>;
  let mockDataService: Partial<DataService>;

  async function setup(beers: BeerCheckin[] = []) {
    mockDataService = {
      getBeersAll: () => of(beers),
    };

    await TestBed.configureTestingModule({
      imports: [
        BeerHistoryComponent,
        HttpClientTestingModule,
        RouterTestingModule,
        MatDialogModule,
        ReactiveFormsModule,
        FormsModule,
      ],
      providers: [{ provide: DataService, useValue: mockDataService }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }

  beforeEach(async () => {
    await setup();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BeerHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("filtering", () => {
    beforeEach(async () => {
      await TestBed.resetTestingModule();
      await setup(sampleBeers);
      fixture = TestBed.createComponent(BeerHistoryComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it("loads every check-in when no filters are narrowed", () => {
      expect(component.filteredBeers.length).toBe(3);
      expect(component.totalItems).toBe(3);
    });

    it("filters by search term across name, style and brewery", () => {
      component.searchTerm = "stout";
      component.applyFilters();
      expect(component.filteredBeers.length).toBe(1);

      component.searchTerm = "alpha";
      component.applyFilters();
      expect(component.filteredBeers.length).toBe(2);

      component.searchTerm = "nope";
      component.applyFilters();
      expect(component.filteredBeers.length).toBe(0);
    });

    it("narrows results when a brewery is deselected", () => {
      const breweryFilter = component.filterFields.find(
        (f) => f.field === "brewery",
      )!;
      breweryFilter.selected = ["Beta Brewing"];
      component.applyFilters();

      expect(component.filteredBeers.length).toBe(1);
    });

    it("computes cross-filter counts that ignore the field's own selection", () => {
      const breweryFilter = component.filterFields.find(
        (f) => f.field === "brewery",
      )!;
      breweryFilter.selected = ["Beta Brewing"];
      component.applyFilters();

      // The brewery count map is not narrowed by the brewery selection, so
      // Alpha's two check-ins are still counted there.
      expect(breweryFilter.countMap!["Alpha Brewing"]).toBe(2);
      expect(breweryFilter.countMap!["Beta Brewing"]).toBe(1);

      // The style count map is narrowed by the brewery selection.
      const styleFilter = component.filterFields.find(
        (f) => f.field === "beer_style",
      )!;
      expect(styleFilter.countMap!["IPA - New England"]).toBeUndefined();
      expect(styleFilter.countMap!["Stout - Irish Dry"]).toBe(1);
    });

    it("resets to the first page when the filter changes", () => {
      component.currentPage = 3;
      component.onFilterChange();
      expect(component.currentPage).toBe(1);
    });
  });
});
