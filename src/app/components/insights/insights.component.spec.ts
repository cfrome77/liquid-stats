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

  describe("category classification", () => {
    const categoryOf = (beerStyle: string): BeerCheckin =>
      makeStyleBeers(beerStyle, 1)[0]!;

    it("keeps a porter out of the wine list", () => {
      const porter = categoryOf("Baltic Porter");
      expect(component.matchesCategory(porter, "Stout / Porter")).toBeTrue();
      expect(component.matchesCategory(porter, "Wine")).toBeFalse();
    });

    it("classifies a spirit the keyword list previously missed", () => {
      const grappa = categoryOf("Grappa");
      expect(component.matchesCategory(grappa, "Spirit / RTD")).toBeTrue();
      expect(
        component.matchesCategory(grappa, "Other / Specialty"),
      ).toBeFalse();
    });

    it("shows only uncategorized drinks under Other / Specialty", () => {
      const ipa = categoryOf("IPA - American");
      const mystery = categoryOf("Mystery Liquid");
      expect(
        component.matchesCategory(mystery, "Other / Specialty"),
      ).toBeTrue();
      expect(component.matchesCategory(ipa, "Other / Specialty")).toBeFalse();
    });

    it("keeps the chart count and the category list in agreement", async () => {
      const beers: BeerCheckin[] = [
        ...makeStyleBeers("Baltic Porter", 2),
        ...makeStyleBeers("IPA - American", 1),
        ...makeStyleBeers("Grappa", 1),
      ];
      const store = jasmine.createSpyObj("BeerStoreService", ["load"], {
        beers$: of(beers),
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

      const labels = instance.styleBarChartData.labels ?? [];
      const data = instance.styleBarChartData.datasets[0]?.data ?? [];

      // The porter must not appear as wine, and grappa must be its own bar.
      expect(labels).not.toContain("Wine");
      expect(labels).toContain("Stout / Porter");
      expect(labels).toContain("Spirit / RTD");

      // Every bar's count matches the number of drinks its list would show.
      labels.forEach((label, i) => {
        const listed = beers.filter((b) =>
          instance.matchesCategory(b, String(label)),
        ).length;
        expect(listed)
          .withContext(String(label))
          .toBe(data[i] ?? 0);
      });
    });
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

  it("should not auto-focus the search input when a beers dialog opens", () => {
    component.openCategoryDialog("Lager / Pilsner");
    expect(dialogSpy.calls.mostRecent().args[1]?.autoFocus).toBeFalse();
  });

  it("should not auto-focus the search input when the styles dialog opens", () => {
    component.openStylesDialog();
    expect(dialogSpy.calls.mostRecent().args[1]?.autoFocus).toBeFalse();
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

    it("matches clicks by the axis each chart lays its bars along", () => {
      // The style chart is horizontal (one bar per row), so a click resolves to
      // the nearest row. The histogram is vertical, so it resolves to the
      // nearest column. Matching on the other axis would let a click land on a
      // bar in a different row or column.
      expect(component.styleBarChartOptions.indexAxis).toBe("y");
      expect(component.styleBarChartOptions.interaction).toEqual({
        mode: "nearest",
        axis: "y",
        intersect: false,
      });
      expect(component.ratingChartOptions.interaction).toEqual({
        mode: "nearest",
        axis: "x",
        intersect: false,
      });
    });

    it("ignores a click on a rating column that has no check-ins", () => {
      dialogSpy.calls.reset();
      // The default fixture has no check-ins in the 0.25 bin.
      expect(component.ratingHistogramChartData.datasets[0]!.data[0]).toBe(0);

      (
        component as unknown as {
          onRatingChartClick: (elements: { index: number }[]) => void;
        }
      ).onRatingChartClick([{ index: 0 }]);

      expect(dialogSpy).not.toHaveBeenCalled();
    });

    it("registers a label-tap plugin on each chart", () => {
      // Chart.js only fires onClick inside the plot area, so the axis labels
      // need a plugin. Each chart gets its own instance.
      expect(component.styleBarChartPlugins.map((p) => p.id)).toEqual([
        "styleLabelTap",
      ]);
      expect(component.ratingChartPlugins.map((p) => p.id)).toEqual([
        "ratingLabelTap",
      ]);
    });

    it("opens the style named by a tap on its label", () => {
      const index = labels().indexOf("Lager / Pilsner");
      const chart = {
        scales: { y: { getPixelForValue: (i: number) => 20 + i * 40 } },
        chartArea: { left: 100, right: 400, top: 0, bottom: 200 },
      };

      // A tap left of the plot area, level with the row.
      const resolved = (
        component as unknown as {
          resolveStyleLabelTarget: (
            chart: unknown,
            x: number,
            y: number,
          ) => number | null;
        }
      ).resolveStyleLabelTarget(chart, 40, 20 + index * 40);

      expect(resolved).toBe(index);
    });

    it("ignores a label tap inside the plot area, which Chart.js handles", () => {
      const chart = {
        scales: { y: { getPixelForValue: (i: number) => 20 + i * 40 } },
        chartArea: { left: 100, right: 400, top: 0, bottom: 200 },
      };

      const resolved = (
        component as unknown as {
          resolveStyleLabelTarget: (
            chart: unknown,
            x: number,
            y: number,
          ) => number | null;
        }
      ).resolveStyleLabelTarget(chart, 200, 20);

      expect(resolved).toBeNull();
    });

    it("ignores a tap on the label of an empty rating column", () => {
      // The default fixture has no check-ins in the 0.25 bin.
      expect(component.ratingHistogramChartData.datasets[0]!.data[0]).toBe(0);
      const chart = {
        scales: { x: { getPixelForValue: (i: number) => 10 + i * 10 } },
        chartArea: { left: 0, right: 400, top: 0, bottom: 200 },
      };

      const resolved = (
        component as unknown as {
          resolveRatingLabelTarget: (
            chart: unknown,
            x: number,
            y: number,
          ) => number | null;
        }
      ).resolveRatingLabelTarget(chart, 10, 260);

      expect(resolved).toBeNull();
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
