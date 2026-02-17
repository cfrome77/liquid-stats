import { ComponentFixture, TestBed } from "@angular/core/testing";

import { BeerStyleDialogComponent } from "./beer-style-dialog.component";

describe("BeerStyleDialogComponent", () => {
  let component: BeerStyleDialogComponent;
  let fixture: ComponentFixture<BeerStyleDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BeerStyleDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BeerStyleDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
