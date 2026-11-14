import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatCardModule } from "@angular/material/card";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { CardComponent } from "./card.component";

describe("CardComponent", () => {
  let component: CardComponent;
  let fixture: ComponentFixture<CardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CardComponent, MatCardModule],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(CardComponent);
    component = fixture.componentInstance;
    component.cardData = {
      title: "Test Beer",
      subtitle: "Test Style",
      breweryName: "Test Brewery",
      rating: 4,
      mainImage: "test.jpg",
      footerInfo: {
        text: "Test Footer",
        link: "http://test.com",
        timestamp: "2023-01-01",
      },
    };
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("handleImageError", () => {
    it("walks from the primary image to the provided fallback", () => {
      const img = document.createElement("img");
      img.setAttribute("src", "broken-hd.jpg");
      component.handleImageError(
        { target: img } as unknown as Event,
        "broken-sm.jpg",
      );
      expect(img.getAttribute("src")).toBe("broken-sm.jpg");
    });

    it("falls back to the bundled placeholder when no fallback is given", () => {
      const img = document.createElement("img");
      img.setAttribute("src", "broken.jpg");
      component.handleImageError({ target: img } as unknown as Event);
      expect(img.getAttribute("src")).toBe(
        "assets/images/beer-placeholder.svg",
      );
    });

    it("reaches the placeholder when the fallback is the same broken URL", () => {
      const img = document.createElement("img");
      img.setAttribute("src", "broken.jpg");
      component.handleImageError(
        { target: img } as unknown as Event,
        "broken.jpg",
      );
      expect(img.getAttribute("src")).toBe(
        "assets/images/beer-placeholder.svg",
      );
    });

    it("does not loop when the placeholder itself fails", () => {
      const img = document.createElement("img");
      img.setAttribute("src", "assets/images/beer-placeholder.svg");
      component.handleImageError({ target: img } as unknown as Event);
      expect(img.getAttribute("src")).toBe(
        "assets/images/beer-placeholder.svg",
      );
    });
  });

  it("should correctly evaluate hasSocialLinks", () => {
    expect(component.hasSocialLinks).toBeFalse();

    component.cardData = {
      ...component.cardData,
      extraData: {
        socialLinks: {
          url: "https://example.com",
        },
      },
    };
    expect(component.hasSocialLinks).toBeTrue();
  });

  it("should render badge chips with avatar images when extraData contains badges", () => {
    fixture.componentRef.setInput("cardData", {
      ...component.cardData,
      extraData: {
        badges: [
          {
            badge_name: "Tested Badge",
            badge_image: {
              sm: "badge-sm.jpg",
              md: "badge-md.jpg",
              lg: "badge-lg.jpg",
            },
            badge_description: "Badge Description",
            badge_hint: "",
            media: { badge_image_sm: "badge-sm.jpg" },
            earned_at: "2023-01-01",
            user_badge_id: 1,
          },
        ],
      },
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const chip = compiled.querySelector("mat-chip");
    expect(chip).toBeTruthy();
    expect(chip?.textContent).toContain("Tested Badge");

    const img = chip?.querySelector("img[matChipAvatar]") as HTMLImageElement;
    expect(img).toBeTruthy();
    expect(img.src).toContain("badge-sm.jpg");
  });

  it("should sanitize the description HTML bound via innerHTML", () => {
    fixture.componentRef.setInput("cardData", {
      ...component.cardData,
      description:
        '<a href="https://untappd.com">Link</a><script>window.hacked = true;</script>',
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const comment = compiled.querySelector(".comment");
    expect(comment?.querySelector("a")?.getAttribute("href")).toBe(
      "https://untappd.com",
    );
    expect(comment?.querySelector("script")).toBeNull();
  });
});
