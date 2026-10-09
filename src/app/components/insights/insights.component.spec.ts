import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import {
  MatDialogModule,
  MatDialogRef,
  MatDialog,
} from "@angular/material/dialog";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { of } from "rxjs";

import { InsightsComponent } from "./insights.component";
import { BeerStoreService } from "src/app/core/services/beer-store.service";
import { BeerCheckin } from "src/app/core/models/beer.model";
import { GenericBeersDialogData } from "src/app/shared/components/beer-style-dialog/beer-style-dialog.component";

describe("InsightsComponent", () => {
  let component: InsightsComponent;
  let fixture: ComponentFixture<InsightsComponent>;
  let mockBeerStore: jasmine.SpyObj<BeerStoreService>;
  let dialogSpy: jasmine.Spy;

  const sampleBeers: BeerCheckin[] = [
    {
      beer: {
        bid: 101,
        beer_name: "Pilsner Urquell",
        beer_style: "Pilsner - Czech / German",
        beer_label: "http://example.com/pilsner.png",
        beer_abv: 4.4,
        beer_slug: "pilsner-urquell",
      },
      brewery: {
        brewery_id: 201,
        brewery_name: "Plzeňský Prazdroj",
        country_name: "Czech Republic",
        location: { brewery_state: "Plzeň" },
      },
      rating_score: 4.25,
      first_created_at: "2026-05-10 14:00:00",
      recent_created_at: "2026-05-15 18:00:00",
      recent_checkin_id: 12345,
      count: 3,
    },
    {
      beer: {
        bid: 102,
        beer_name: "Guinness Extra Stout",
        beer_style: "Stout - Irish Dry",
        beer_label: "http://example.com/stout.png",
        beer_abv: 5.6,
        beer_slug: "guinness-extra-stout",
      },
      brewery: {
        brewery_id: 202,
        brewery_name: "Guinness Brewery",
        country_name: "Ireland",
        location: { brewery_state: "Dublin" },
      },
      rating_score: 4.0,
      first_created_at: "2026-06-01 12:00:00",
      recent_created_at: "2026-06-02 20:00:00",
      recent_checkin_id: 12346,
      count: 1,
    },
  ];

  beforeEach(async () => {
    mockBeerStore = jasmine.createSpyObj("BeerStoreService", ["load"], {
      beers$: of(sampleBeers),
    });

    const mockDialogRef = {
      afterClosed: () => of(undefined),
      close: () => {},
    } as unknown as MatDialogRef<unknown>;

    dialogSpy = spyOn(MatDialog.prototype, "open").and.returnValue(
      mockDialogRef,
    );

    await TestBed.configureTestingModule({
      imports: [
        InsightsComponent,
        HttpClientTestingModule,
        MatDialogModule,
        BrowserAnimationsModule,
      ],
      providers: [{ provide: BeerStoreService, useValue: mockBeerStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(InsightsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create and load insights data", () => {
    expect(component).toBeTruthy();
    expect(component.beers.length).toBe(2);
    expect(component.isLoading()).toBeFalse();
    expect(component.totalUniqueStyles()).toBe(2);
  });

  it("should correctly identify drink categories with matchesCategory", () => {
    const testBeer = sampleBeers[0];
    expect(component.matchesCategory(testBeer, "Lager / Pilsner")).toBeTrue();
    expect(component.matchesCategory(testBeer, "Stout / Porter")).toBeFalse();
  });

  it("should open dialog for openAbvDialog displaying top highest ABV drinks", () => {
    component.openAbvDialog();
    expect(dialogSpy).toHaveBeenCalled();
    const data = dialogSpy.calls.mostRecent().args[1]
      ?.data as GenericBeersDialogData;
    expect(data.title).toBe("Top Highest ABV Drinks");
    expect(data.beers.length).toBe(2);
    expect(data.beers[0].beerName).toBe("Guinness Extra Stout");
  });

  it("should open dialog for openStylesDialog with styles list and reopen styles list on back", () => {
    const mockStylesDialogRefSelect = {
      afterClosed: () => of("Pilsner - Czech / German"),
      close: () => {},
    } as unknown as MatDialogRef<unknown>;

    const mockBeersDialogRef = {
      afterClosed: () => of("back"),
      close: () => {},
    } as unknown as MatDialogRef<unknown>;

    const mockStylesDialogRefClose = {
      afterClosed: () => of(undefined),
      close: () => {},
    } as unknown as MatDialogRef<unknown>;

    dialogSpy.and.returnValues(
      mockStylesDialogRefSelect,
      mockBeersDialogRef,
      mockStylesDialogRefClose,
    );

    component.openStylesDialog();
    expect(dialogSpy).toHaveBeenCalled();

    const data = dialogSpy.calls.argsFor(1)[1]?.data as GenericBeersDialogData;
    expect(data.title).toBe("Pilsner - Czech / German Drinks");
    expect(data.showBackButton).toBeTrue();
    expect(dialogSpy.calls.count()).toBe(3);
  });

  it("should open dialog for openCategoryDialog", () => {
    component.openCategoryDialog("Lager / Pilsner");
    expect(dialogSpy).toHaveBeenCalled();
    const data = dialogSpy.calls.mostRecent().args[1]
      ?.data as GenericBeersDialogData;
    expect(data.title).toBe("Lager / Pilsner Drinks");
    expect(data.beers.length).toBe(1);
    expect(data.beers[0].beerName).toBe("Pilsner Urquell");
  });

  it("should open dialog for openBreweryDialog", () => {
    component.openBreweryDialog("Guinness Brewery");
    expect(dialogSpy).toHaveBeenCalled();
    const data = dialogSpy.calls.mostRecent().args[1]
      ?.data as GenericBeersDialogData;
    expect(data.title).toBe("Guinness Brewery Drinks");
    expect(data.beers.length).toBe(1);
  });

  it("should open dialog for openPeakMonthDialog", () => {
    component.openPeakMonthDialog("May 2026");
    expect(dialogSpy).toHaveBeenCalled();
    const data = dialogSpy.calls.mostRecent().args[1]
      ?.data as GenericBeersDialogData;
    expect(data.title).toBe("Check-ins in May 2026");
    expect(data.beers.length).toBe(1);
  });

  it("should route milestone dialog clicks correctly", () => {
    component.openMilestoneDialog({
      icon: "business",
      title: "Favorite Brewery",
      value: "Plzeňský Prazdroj",
      subtitle: "3 check-ins logged",
    });
    expect(dialogSpy).toHaveBeenCalled();
    const data = dialogSpy.calls.mostRecent().args[1]
      ?.data as GenericBeersDialogData;
    expect(data.title).toBe("Plzeňský Prazdroj Drinks");
  });
});
