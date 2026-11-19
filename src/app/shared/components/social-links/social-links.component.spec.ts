import { ComponentFixture, TestBed } from "@angular/core/testing";
import { provideRouter } from "@angular/router";

import { SocialLinksComponent } from "./social-links.component";

describe("SocialLinksComponent", () => {
  let component: SocialLinksComponent;
  let fixture: ComponentFixture<SocialLinksComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SocialLinksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("labels each icon-only social link for screen readers", () => {
    fixture.componentRef.setInput("contact", {
      url: "https://example.com",
      facebook: "https://facebook.com/example",
      instagram: "example",
    });
    fixture.componentRef.setInput("mapData", {
      lat: 1,
      lng: 2,
      breweryId: "3",
    });
    fixture.detectChanges();

    const links = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll("a"),
    );
    expect(links.length).toBe(4);
    for (const link of links) {
      expect(link.getAttribute("aria-label"))
        .withContext(`missing aria-label on ${link.outerHTML}`)
        .toBeTruthy();
      expect(link.querySelector("mat-icon")?.getAttribute("aria-hidden")).toBe(
        "true",
      );
    }
  });
});
