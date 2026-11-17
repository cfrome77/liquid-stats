import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogModule } from "@angular/material/dialog";
import { ActivatedRoute, Router, provideRouter } from "@angular/router";
import { of, Subject, throwError } from "rxjs";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";

import { BadgesComponent } from "./badges.component";
import { DataService } from "src/app/core/services/data.service";
import { Badge } from "src/app/core/models/badge.model";

describe("BadgesComponent", () => {
  let component: BadgesComponent;
  let fixture: ComponentFixture<BadgesComponent>;
  let mockDataService: Partial<DataService>;

  beforeEach(async () => {
    mockDataService = {
      getBadges: () => of([]),
    };

    await TestBed.configureTestingModule({
      imports: [BadgesComponent, HttpClientTestingModule, MatDialogModule],
      providers: [
        { provide: DataService, useValue: mockDataService },
        provideRouter([]),
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BadgesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("shows a skeleton while the badges request is in flight", () => {
    const pending = new Subject<Badge[]>();
    mockDataService.getBadges = () => pending.asObservable();

    const fresh = TestBed.createComponent(BadgesComponent);
    fresh.detectChanges();

    expect(fresh.componentInstance.isLoading).toBeTrue();
    expect(
      (fresh.nativeElement as HTMLElement).querySelector("app-skeleton-card"),
    ).toBeTruthy();

    pending.next([]);
    pending.complete();
    fresh.detectChanges();

    expect(fresh.componentInstance.isLoading).toBeFalse();
    expect(
      (fresh.nativeElement as HTMLElement).querySelector("app-skeleton-card"),
    ).toBeFalsy();
  });

  describe("URL state", () => {
    async function initAt(
      params: Record<string, string>,
      badges: Badge[] = [],
    ): Promise<Router> {
      mockDataService = { getBadges: () => of(badges) };
      await TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [BadgesComponent, MatDialogModule],
        providers: [
          { provide: DataService, useValue: mockDataService },
          provideRouter([]),
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                queryParamMap: { get: (k: string) => params[k] ?? null },
              },
            },
          },
        ],
        schemas: [CUSTOM_ELEMENTS_SCHEMA],
      }).compileComponents();

      const router = TestBed.inject(Router);
      fixture = TestBed.createComponent(BadgesComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      return router;
    }

    it("restores view mode, page, and page size from the URL", async () => {
      const many: Badge[] = Array.from({ length: 40 }, (_, i) => ({
        badge_name: `Badge ${i + 1}`,
        badge_description: "",
        badge_hint: "",
        badge_image: { sm: "", md: "", lg: "" },
        media: { badge_image_sm: "" },
        earned_at: "2026-01-01",
        user_badge_id: i,
      }));
      await initAt({ view: "compact", perPage: "30", page: "2" }, many);

      expect(component.viewMode()).toBe("compact");
      expect(component.itemsPerPage).toBe(30);
      expect(component.currentPage).toBe(2);
    });

    it("falls back to defaults for malformed pagination values", async () => {
      await initAt({ view: "grid", perPage: "999", page: "0" });

      expect(component.viewMode()).toBe("cards");
      expect(component.itemsPerPage).toBe(10);
      expect(component.currentPage).toBe(1);
    });

    it("writes a page size change back to the URL", async () => {
      const router = await initAt({});
      const navigate = spyOn(router, "navigate");

      component.onItemsPerPageChange(20);

      const queryParams = navigate.calls.mostRecent().args[1]!
        .queryParams as Record<string, string | null>;
      expect(queryParams["perPage"]).toBe("20");
    });
  });

  it("shows a retryable error state when the badges request fails", () => {
    mockDataService.getBadges = () =>
      throwError(() => new Error("network error"));
    mockDataService.clearCache = jasmine.createSpy("clearCache");

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.hasLoadError()).toBeTrue();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain("couldn't load your badges");

    const button = el.querySelector(
      "app-empty-state button",
    ) as HTMLButtonElement;
    button.click();
    expect(mockDataService.clearCache).toHaveBeenCalled();
  });
});
