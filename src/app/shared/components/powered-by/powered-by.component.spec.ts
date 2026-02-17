import { ComponentFixture, TestBed } from "@angular/core/testing";

import { PoweredByComponent } from "./powered-by.component";

describe("PoweredByComponent", () => {
  let component: PoweredByComponent;
  let fixture: ComponentFixture<PoweredByComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PoweredByComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(PoweredByComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
