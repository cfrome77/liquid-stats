import { ComponentFixture, TestBed } from "@angular/core/testing";
import { WishlistComponent } from "./wishlist.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { DataService } from "../../core/services/data.service";
import { of, Subject, throwError } from "rxjs";

describe("WishlistComponent", () => {
  let component: WishlistComponent;
  let fixture: ComponentFixture<WishlistComponent>;
  let mockDataService: jasmine.SpyObj<DataService>;

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj("DataService", ["getWishlist"]);
    mockDataService.getWishlist.and.returnValue(
      of({
        response: {
          wishlist: {
            items: [],
          },
        },
      }),
    );

    await TestBed.configureTestingModule({
      imports: [
        WishlistComponent,
        HttpClientTestingModule,
        RouterTestingModule,
      ],
      providers: [{ provide: DataService, useValue: mockDataService }],
    }).compileComponents();

    fixture = TestBed.createComponent(WishlistComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("maps a wishlist item into card data with a link and thumbnail images", () => {
    const card = component.transformWishlistData({
      count: 1,
      first_created_at: "2026-01-01",
      recent_created_at: "2026-01-01",
      created_at: "2026-01-01",
      rating_score: 0,
      beer: {
        beer_abv: 5,
        bid: 42,
        beer_label: "https://example.com/label.png",
        beer_label_hd: "https://example.com/label_hd.png",
        beer_name: "Test IPA",
        beer_style: "IPA",
        beer_slug: "test-ipa",
        beer_description: "A hoppy ale",
      },
      brewery: {
        brewery_id: 7,
        brewery_name: "Test Brewery",
        brewery_label: "https://example.com/brewery.png",
        brewery_label_hd: "https://example.com/brewery_hd.png",
        country_name: "USA",
        location: { brewery_state: "OR" },
      },
    });

    expect(card.title).toBe("Test IPA");
    // Thumbnails use the small label; the HD variant is kept only as a fallback.
    expect(card.mainImage).toBe("https://example.com/label.png");
    expect(card.secondaryImage).toBe("https://example.com/brewery.png");
    expect(card.extraData?.originalMainImage).toBe(
      "https://example.com/label_hd.png",
    );
    expect(card.footerInfo.link).toBe("https://untappd.com/b/test-ipa/42");
    expect(card.footerInfo.text).toBe("Wishlist Item");
  });

  it("falls back to a friendly timestamp when the item has no date", () => {
    const card = component.transformWishlistData({
      count: 1,
      first_created_at: "2026-01-01",
      recent_created_at: "2026-01-01",
      rating_score: 0,
      beer: {
        beer_abv: 5,
        bid: 42,
        beer_label: "label.png",
        beer_name: "Test IPA",
        beer_style: "IPA",
      },
      brewery: {
        brewery_name: "Test Brewery",
        country_name: "USA",
        location: {},
      },
    });

    expect(card.footerInfo.timestamp).toBe("Added long ago");
    expect(card.mainImage).toBe("label.png");
  });

  it("shows a skeleton while the wishlist request is in flight", () => {
    const pending = new Subject<unknown>();
    mockDataService.getWishlist.and.returnValue(pending.asObservable());

    const fresh = TestBed.createComponent(WishlistComponent);
    fresh.detectChanges();

    expect(fresh.componentInstance.isLoading).toBeTrue();
    expect(
      (fresh.nativeElement as HTMLElement).querySelector("app-skeleton-card"),
    ).toBeTruthy();

    pending.next({ response: { beers: { items: [] } } });
    pending.complete();
    fresh.detectChanges();

    expect(fresh.componentInstance.isLoading).toBeFalse();
    expect(
      (fresh.nativeElement as HTMLElement).querySelector("app-skeleton-card"),
    ).toBeFalsy();
  });

  it("shows a retryable error state when the wishlist request fails", () => {
    mockDataService.getWishlist.and.returnValue(
      throwError(() => new Error("network error")),
    );
    mockDataService.clearCache = jasmine.createSpy("clearCache");

    component.ngOnInit();
    fixture.detectChanges();

    expect(component.hasLoadError()).toBeTrue();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.textContent).toContain("couldn't load your wishlist");

    const button = el.querySelector(
      "app-empty-state button",
    ) as HTMLButtonElement;
    button.click();
    expect(mockDataService.clearCache).toHaveBeenCalled();
  });
});
