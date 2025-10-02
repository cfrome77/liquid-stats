import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CheckinsComponent } from "./checkins.component";

describe("CheckinsComponent", () => {
  let component: CheckinsComponent;
  let fixture: ComponentFixture<CheckinsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CheckinsComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckinsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
