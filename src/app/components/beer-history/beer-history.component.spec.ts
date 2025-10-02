import { ComponentFixture, TestBed } from "@angular/core/testing";

import { BeerHistoryComponent } from "./beer-history.component";

describe("BeerHistoryComponent", () => {
  let component: BeerHistoryComponent;
  let fixture: ComponentFixture<BeerHistoryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BeerHistoryComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BeerHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
