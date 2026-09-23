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
});
