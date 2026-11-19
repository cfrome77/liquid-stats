import { TestBed } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { AppComponent } from "./app.component";
import { MatDialogModule } from "@angular/material/dialog";
import { OverlayModule } from "@angular/cdk/overlay";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { BehaviorSubject } from "rxjs";
import { BeerStoreService } from "./core/services/beer-store.service";

describe("AppComponent", () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        MatDialogModule,
        OverlayModule,
        HttpClientTestingModule,
        BrowserAnimationsModule,
        AppComponent,
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  });

  it("should create the app", () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have as title 'liquid-stats'`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual("liquid-stats");
  });

  it("should render Checkins in the mobile bottom navigation menu", () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const navLinks = Array.from(
      compiled.querySelectorAll<HTMLAnchorElement>(".mobile-bottom-nav a"),
    );
    const checkinsNavLink = navLinks.find((link) =>
      link.getAttribute("href")?.includes("/checkins"),
    );
    expect(checkinsNavLink).toBeTruthy();
  });

  it("exposes a skip link that targets the main landmark", () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    const skipLink = compiled.querySelector("a.skip-link") as HTMLAnchorElement;
    expect(skipLink).toBeTruthy();
    expect(skipLink.getAttribute("href")).toBe("#main-content");

    const main = compiled.querySelector("main#main-content");
    expect(main).toBeTruthy();
  });

  it("labels every icon-only toolbar control", () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;

    // An icon-only control renders a <mat-icon> whose ligature text is the only
    // text content; anything left after removing the icon text must be labelled.
    const controls = Array.from(
      compiled.querySelectorAll<HTMLElement>("mat-toolbar button"),
    ).filter((el) => {
      const icon = el.querySelector("mat-icon");
      if (!icon) return false;
      const remaining = (el.textContent ?? "").replace(
        icon.textContent ?? "",
        "",
      );
      return remaining.trim().length === 0;
    });

    expect(controls.length).toBeGreaterThan(0);
    for (const control of controls) {
      expect(control.getAttribute("aria-label"))
        .withContext(`missing aria-label on ${control.outerHTML}`)
        .toBeTruthy();
    }
  });

  it("announces load failures through an assertive status region", () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();

    // Drive the same stream the app subscribes to, so the assertion covers the
    // real error path rather than a hand-set flag.
    const store = TestBed.inject(BeerStoreService) as unknown as {
      loadErrorSubject: BehaviorSubject<boolean>;
    };
    store.loadErrorSubject.next(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const banner = compiled.querySelector(".global-error-banner");
    expect(banner).toBeTruthy();
    expect(banner?.getAttribute("role")).toBe("alert");
    expect(banner?.getAttribute("aria-live")).toBe("assertive");
  });
});
