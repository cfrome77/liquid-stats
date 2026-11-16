import { TestBed } from "@angular/core/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { AppComponent } from "./app.component";
import { MatDialogModule } from "@angular/material/dialog";
import { OverlayModule } from "@angular/cdk/overlay";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

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
});
