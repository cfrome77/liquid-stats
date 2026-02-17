import { ComponentFixture, TestBed } from "@angular/core/testing";

import { BadgesComponent } from "./badges.component";
import { SharedTestingModule } from "src/app/testing/shared-testing.module";

describe("BadgesComponent", () => {
  let component: BadgesComponent;
  let fixture: ComponentFixture<BadgesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BadgesComponent],
      imports: [SharedTestingModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BadgesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
