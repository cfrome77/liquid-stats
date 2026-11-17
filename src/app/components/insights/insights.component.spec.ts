import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import {
  MatDialogModule,
  MatDialogRef,
  MatDialog,
} from "@angular/material/dialog";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { ActivatedRoute, Router, provideRouter } from "@angular/router";
import { of } from "rxjs";

import { InsightsComponent } from "./insights.component";
import { BeerStoreService } from "src/app/core/services/beer-store.service";
import { BeerCheckin } from "src/app/core/models/beer.model";
import { GenericBeersDialogData } from "src/app/shared/components/beer-style-dialog/beer-style-dialog.component";
import { CHART_FILTER_PARAMS } from "src/app/core/utils/view-state";

describe("InsightsComponent", () => {
  let component: InsightsComponent;
  let fixture: ComponentFixture<InsightsComponent>;
  let mockBeerStore: jasmine.SpyObj<BeerStoreService>;
  let dialogSpy: jasmine.Spy;

  const makeStyleBeers = (beerStyle: string, count: number): BeerCheckin[] =>
    Array.from({ length: count }, (_, i) => ({
      beer: {
        bid: 1000 + i,
        beer_name: `${beerStyle} ${i}`,
        beer_style: beerStyle,
        beer_label: "http://example.com/beer.png",
        beer_abv: 5,
        beer_slug: `${beerStyle}-${i}`,
      },
      brewery: {
        brewery_id: 200,
        brewery_name: "Test Brewery",
        country_name: "United States",
        location: { brewery_state: "Test" },
      },
      rating_score: 4,
      first_created_at: "2026-05-10 14:00:00",
      recent_created_at: "2026-05-15 18:00:00",
      recent_checkin_id: 1000 + i,
      count: 1,
    }));

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
      checkins$: of([]),
      loadError$: of(false),
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
      providers: [
        { provide: BeerStoreService, useValue: mockBeerStore },
        provideRouter([]),
      ],
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
    const testBeer = sampleBeers[0]!;
    expect(component.matchesCategory(testBeer, "Lager / Pilsner")).toBeTrue();
    expect(component.matchesCategory(testBeer, "Stout / Porter")).toBeFalse();
  });

  describe("ranked style distribution bar chart", () => {
    it("no longer exposes the removed radar chart data or options", () => {
      expect(
        (component as unknown as Record<string, unknown>)[
          "styleRadarChartData"
        ],
      ).toBeUndefined();
      expect(
        (component as unknown as Record<string, unknown>)["radarChartOptions"],
      ).toBeUndefined();
    });

    it("renders a horizontal bar chart in place of the radar chart", () => {
      const el = fixture.nativeElement as HTMLElement;
      const canvases = el.querySelectorAll("canvas");
      expect(canvases.length).toBeGreaterThan(0);

      expect(component.styleBarChartOptions.indexAxis).toBe("y");
      expect(component.styleBarChartData.datasets[0]?.label).toBe("Check-ins");

      const rendered = el.textContent ?? "";
      expect(rendered).toContain("Style Distribution");
      expect(rendered).not.toContain("Style Radar Distribution");
    });

    it("sorts styles in descending order of check-in count", () => {
      const labels = component.styleBarChartData.labels ?? [];
      const data = component.styleBarChartData.datasets[0]?.data ?? [];
      expect(labels.length).toBe(data.length);
      expect(labels.length).toBeGreaterThan(0);

      for (let i = 1; i < data.length; i++) {
        expect(data[i - 1]!).toBeGreaterThanOrEqual(data[i]!);
      }
    });

    it("ranks the most frequent style first across many styles", async () => {
      const manyBeers: BeerCheckin[] = [
        ...makeStyleBeers("IPA - American", 3),
        ...makeStyleBeers("Stout - Imperial", 2),
        ...makeStyleBeers("Pilsner - Czech", 1),
      ];
      const store = jasmine.createSpyObj("BeerStoreService", ["load"], {
        beers$: of(manyBeers),
        checkins$: of([]),
        loadError$: of(false),
      });

      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [
          InsightsComponent,
          HttpClientTestingModule,
          MatDialogModule,
          BrowserAnimationsModule,
        ],
        providers: [
          { provide: BeerStoreService, useValue: store },
          provideRouter([]),
        ],
      }).compileComponents();

      const rankedFixture = TestBed.createComponent(InsightsComponent);
      rankedFixture.detectChanges();
      const instance = rankedFixture.componentInstance;

      expect(instance.styleBarChartData.labels).toEqual([
        "IPA",
        "Stout / Porter",
        "Lager / Pilsner",
      ]);
      expect(instance.styleBarChartData.datasets[0]?.data).toEqual([3, 2, 1]);
    });

    it("grows the chart height so every style row stays readable", () => {
      expect(component.styleBarChartHeight()).toBeGreaterThanOrEqual(220);
      const container = (fixture.nativeElement as HTMLElement).querySelector(
        ".style-bar-chart-container",
      ) as HTMLElement | null;
      expect(container).not.toBeNull();
      expect(container!.style.height).toBe(
        `${component.styleBarChartHeight()}px`,
      );
    });

    it("wraps long style labels instead of truncating them", () => {
      const longLabel = "Belgian-Style Quadrupel With Brettanomyces And Oak";
      const wrapped = (
        component as unknown as {
          wrapStyleLabel: (label: string, maxChars?: number) => string;
        }
      ).wrapStyleLabel(longLabel);
      const lines = wrapped.split("\n");

      expect(lines.length).toBeGreaterThan(1);
      // Wrapping must not drop any of the original words.
      expect(lines.join(" ").replace(/\s+/g, " ")).toBe(longLabel);
      for (const line of lines) {
        expect(line.length).toBeLessThanOrEqual(24);
      }
    });

    it("breaks a single over-long word so it cannot overflow the axis", () => {
      const oneWord = "Doppelbockbockbockbockbockbockbockbock";
      const wrapped = (
        component as unknown as {
          wrapStyleLabel: (label: string, maxChars?: number) => string;
        }
      ).wrapStyleLabel(oneWord);
      const lines = wrapped.split("\n");

      expect(lines.length).toBeGreaterThan(1);
      expect(lines.join("")).toBe(oneWord);
      for (const line of lines) {
        expect(line.length).toBeLessThanOrEqual(24);
      }
    });

    it("keeps the personal milestones section below the charts", () => {
      const el = fixture.nativeElement as HTMLElement;
      const milestonesHeading = Array.from(el.querySelectorAll("h3")).find(
        (h) => (h.textContent ?? "").includes("Personal Milestones"),
      );
      expect(milestonesHeading).toBeDefined();

      const milestoneCards = el.querySelectorAll(".milestone-card");
      expect(milestoneCards.length).toBeGreaterThan(0);

      const chart = el.querySelector(".style-bar-chart-container");
      expect(chart).not.toBeNull();
      const position = chart!.compareDocumentPosition(
        milestonesHeading as Node,
      );
      expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });
  });

  it("should open dialog for openAbvDialog displaying top highest ABV drinks", () => {
    component.openAbvDialog();
    expect(dialogSpy).toHaveBeenCalled();
    const data = dialogSpy.calls.mostRecent().args[1]
      ?.data as GenericBeersDialogData;
    expect(data.title).toBe("Top Highest ABV Drinks");
    expect(data.beers.length).toBe(2);
    expect(data.beers[0]!.beerName).toBe("Guinness Extra Stout");
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
    expect(data.beers[0]!.beerName).toBe("Pilsner Urquell");
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

  describe("heatmap accessibility", () => {
    it("labels a day with its check-in count and date", () => {
      expect(
        component.heatmapDayLabel({ count: 3, formattedDate: "May 5, 2026" }),
      ).toBe("3 check-ins on May 5, 2026");
    });

    it("uses the singular form for a single check-in", () => {
      expect(
        component.heatmapDayLabel({ count: 1, formattedDate: "May 5, 2026" }),
      ).toBe("1 check-in on May 5, 2026");
    });

    it("describes a day with no check-ins", () => {
      expect(
        component.heatmapDayLabel({ count: 0, formattedDate: "May 5, 2026" }),
      ).toBe("No check-ins on May 5, 2026");
    });

    it("opens the day dialog on space keydown and prevents default scroll", () => {
      component.computeHeatmap([]);
      const day = {
        date: "2026-05-05",
        formattedDate: "May 5, 2026",
        count: 2,
      };
      const event = new KeyboardEvent("keydown", { key: " " });
      const preventDefault = spyOn(event, "preventDefault");

      component.onDayKeydown(event, day);

      expect(preventDefault).toHaveBeenCalled();
      expect(dialogSpy).toHaveBeenCalled();
    });
  });

  describe("empty data", () => {
    it("stops the skeleton and flags no data when the store returns an empty list", async () => {
      const emptyStore = jasmine.createSpyObj("BeerStoreService", ["load"], {
        beers$: of([]),
        checkins$: of([]),
        loadError$: of(false),
      });
      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [
          InsightsComponent,
          HttpClientTestingModule,
          MatDialogModule,
          BrowserAnimationsModule,
        ],
        providers: [
          { provide: BeerStoreService, useValue: emptyStore },
          provideRouter([]),
        ],
      }).compileComponents();

      const emptyFixture = TestBed.createComponent(InsightsComponent);
      emptyFixture.detectChanges();

      const instance = emptyFixture.componentInstance;
      expect(instance.isLoading()).toBeFalse();
      expect(instance.hasData()).toBeFalse();
      expect(
        emptyFixture.nativeElement.querySelector("app-empty-state"),
      ).not.toBeNull();
    });
  });

  describe("load error", () => {
    it("shows a retryable error state when the store reports a load failure", async () => {
      const errorStore = jasmine.createSpyObj("BeerStoreService", ["load"], {
        beers$: of([]),
        checkins$: of([]),
        loadError$: of(true),
      });
      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [
          InsightsComponent,
          HttpClientTestingModule,
          MatDialogModule,
          BrowserAnimationsModule,
        ],
        providers: [
          { provide: BeerStoreService, useValue: errorStore },
          provideRouter([]),
        ],
      }).compileComponents();

      const errorFixture = TestBed.createComponent(InsightsComponent);
      errorFixture.detectChanges();

      const instance = errorFixture.componentInstance;
      expect(instance.hasLoadError()).toBeTrue();

      const el = errorFixture.nativeElement as HTMLElement;
      expect(el.textContent).toContain("couldn't load your insights");
      const button = el.querySelector(
        "app-empty-state button",
      ) as HTMLButtonElement;
      button.click();
      expect(errorStore.load).toHaveBeenCalledWith(true);
    });
  });

  describe("interactive chart clicks and URL filtering", () => {
    const labels = (): string[] =>
      component.styleBarChartData.labels as string[];

    it("registers Chart.js onClick and onHover handlers plus hover events", () => {
      const style = component.styleBarChartOptions;
      expect(typeof style.onClick).toBe("function");
      expect(typeof style.onHover).toBe("function");
      expect(style.events).toContain("click");
      expect(style.events).toContain("touchstart");

      const rating = component.ratingChartOptions;
      expect(typeof rating.onClick).toBe("function");
      expect(typeof rating.onHover).toBe("function");
    });

    it("sets a pointer cursor over an active element and resets otherwise", () => {
      const target = document.createElement("canvas");
      const setCursor = (
        component as unknown as {
          setPointerCursor: (
            event: { native: { target: HTMLElement } },
            elements: unknown[],
          ) => void;
        }
      ).setPointerCursor.bind(component);

      setCursor({ native: { target } }, [{}]);
      expect(target.style.cursor).toBe("pointer");

      setCursor({ native: { target } }, []);
      expect(target.style.cursor).toBe("default");
    });

    it("extracts the clicked style label and opens the filtered dialog", () => {
      const index = labels().indexOf("Lager / Pilsner");
      expect(index).toBeGreaterThanOrEqual(0);

      (
        component as unknown as {
          onStyleBarClick: (elements: { index: number }[]) => void;
        }
      ).onStyleBarClick([{ index }]);

      const data = dialogSpy.calls.mostRecent().args[1]
        ?.data as GenericBeersDialogData;
      expect(data.title).toBe("Lager / Pilsner Drinks");
      expect(data.beers[0]!.beerName).toBe("Pilsner Urquell");
    });

    it("writes the selected style into the URL with merged query params", () => {
      const router = TestBed.inject(Router);
      const navigate = spyOn(router, "navigate");

      component.selectStyle("IPA");

      expect(navigate).toHaveBeenCalled();
      const extras = navigate.calls.mostRecent().args[1]!;
      expect(extras.queryParams).toEqual({
        [CHART_FILTER_PARAMS.style]: "IPA",
      });
      expect(extras.queryParamsHandling).toBe("merge");
    });

    it("ignores a click when no chart element was hit", () => {
      dialogSpy.calls.reset();
      (
        component as unknown as {
          onStyleBarClick: (elements: unknown[]) => void;
        }
      ).onStyleBarClick([]);
      expect(dialogSpy).not.toHaveBeenCalled();
    });

    it("filters check-ins into a rating bin when a histogram bar is clicked", () => {
      (
        component as unknown as {
          onRatingChartClick: (elements: { index: number }[]) => void;
        }
      ).onRatingChartClick([{ index: 16 }]); // 4.25 -> rounded to 4.25

      const data = dialogSpy.calls.mostRecent().args[1]
        ?.data as GenericBeersDialogData;
      expect(data.title).toBe("4.25★ Drinks");
      expect(data.beers.length).toBe(1);
      expect(data.beers[0]!.beerName).toBe("Pilsner Urquell");
    });

    it("writes the selected rating into the URL", () => {
      const router = TestBed.inject(Router);
      const navigate = spyOn(router, "navigate");

      component.selectRating("4.25");

      const extras = navigate.calls.mostRecent().args[1]!;
      expect(extras.queryParams).toEqual({
        [CHART_FILTER_PARAMS.rating]: "4.25",
      });
      expect(extras.queryParamsHandling).toBe("merge");
    });

    it("deep-links a style from ?style= by opening the filtered list", async () => {
      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [
          InsightsComponent,
          HttpClientTestingModule,
          MatDialogModule,
          BrowserAnimationsModule,
        ],
        providers: [
          { provide: BeerStoreService, useValue: mockBeerStore },
          provideRouter([]),
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                queryParamMap: {
                  get: (k: string) =>
                    k === "style" ? "Lager / Pilsner" : null,
                },
              },
              queryParams: of({ style: "Lager / Pilsner" }),
            },
          },
        ],
      }).compileComponents();

      const deepLinkFixture = TestBed.createComponent(InsightsComponent);
      deepLinkFixture.detectChanges();
      expect(deepLinkFixture.componentInstance).toBeTruthy();

      const data = dialogSpy.calls.mostRecent().args[1]
        ?.data as GenericBeersDialogData;
      expect(data.title).toBe("Lager / Pilsner Drinks");
    });

    it("renders the interaction hint on both charts", () => {
      const el = fixture.nativeElement as HTMLElement;
      const hints = el.querySelectorAll(".chart-interaction-hint");
      expect(hints.length).toBe(2);
      expect(hints[0]!.textContent).toContain("Tap a bar");
    });
  });
});
