import { ComponentFixture, TestBed } from "@angular/core/testing";

import { ScrollToTopComponent } from "./scroll-to-top.component";

describe("ScrollToTopComponent", () => {
  let component: ScrollToTopComponent;
  let fixture: ComponentFixture<ScrollToTopComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScrollToTopComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ScrollToTopComponent);
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("stays hidden until the page is scrolled", () => {
    fixture.detectChanges();
    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        ".fab-scroll-to-top",
      ),
    ).toBeNull();
  });

  it("labels the icon-only button for assistive tech", () => {
    component.isVisible = true;
    fixture.detectChanges();

    const button = (fixture.nativeElement as HTMLElement).querySelector(
      ".fab-scroll-to-top",
    ) as HTMLButtonElement;
    expect(button).toBeTruthy();
    expect(button.getAttribute("aria-label")).toBe("Scroll back to top");
  });

  it("reveals the button once the window scrolls past the threshold", () => {
    spyOnProperty(window, "scrollY", "get").and.returnValue(500);
    component.onWindowScroll();
    fixture.detectChanges();

    expect(
      (fixture.nativeElement as HTMLElement).querySelector(
        ".fab-scroll-to-top",
      ),
    ).toBeTruthy();
  });
});
