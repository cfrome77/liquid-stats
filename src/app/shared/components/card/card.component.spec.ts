import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CardComponent } from "./card.component";
import { SharedTestingModule } from "src/app/testing/shared-testing.module";

describe("CardComponent", () => {
  let component: CardComponent;
  let fixture: ComponentFixture<CardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CardComponent],
      imports: [SharedTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(CardComponent);
    component = fixture.componentInstance;

    component.cardData = {
      title: "Test Beer",
      subtitle: "IPA",
      breweryName: "Test Brewery",
      description: "Nice beer",
      rating: 4.5,
      mainImage: "beer.jpg",
      secondaryImage: "brewery.jpg",
      footerInfo: {
        text: "Test Venue",
        link: "http://test.com",
        timestamp: "2024-01-01",
      },
      extraData: {
        badges: [],
        socialLinks: {},
        mapData: undefined,
        venueId: 1,
        checkinId: 1,
        userName: "testuser",
      },
    };

    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
