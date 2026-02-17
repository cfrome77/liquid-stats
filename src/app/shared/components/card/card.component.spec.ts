import { ComponentFixture, TestBed } from "@angular/core/testing";
import { CardComponent } from "./card.component";

describe("CardComponent", () => {
  let component: CardComponent;
  let fixture: ComponentFixture<CardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CardComponent],
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
});
