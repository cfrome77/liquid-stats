import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CheckinsComponent } from "./checkins.component";
import { SharedTestingModule } from "src/app/testing/shared-testing.module";

describe("CheckinsComponent", () => {
  let component: CheckinsComponent;
  let fixture: ComponentFixture<CheckinsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CheckinsComponent],
      imports: [SharedTestingModule],
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
