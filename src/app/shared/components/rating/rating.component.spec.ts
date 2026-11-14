import { ComponentFixture, TestBed } from "@angular/core/testing";

import { RatingComponent } from "./rating.component";

describe("RatingComponent", () => {
  let component: RatingComponent;
  let fixture: ComponentFixture<RatingComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({}).compileComponents();

    fixture = TestBed.createComponent(RatingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should expose an accessible rating label", () => {
    fixture.componentRef.setInput("ratingScore", 4.5);
    fixture.detectChanges();
    const container = fixture.nativeElement.querySelector(".rating-container");
    expect(container.getAttribute("role")).toBe("img");
    expect(container.getAttribute("aria-label")).toBe("Rating: 4.5 out of 5");
  });

  it("should label an unrated score as not yet rated", () => {
    const container = fixture.nativeElement.querySelector(".rating-container");
    expect(container.getAttribute("aria-label")).toBe("Not yet rated");
  });
});
