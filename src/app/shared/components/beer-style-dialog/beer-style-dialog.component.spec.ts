import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

import { BeerStyleDialogComponent } from "./beer-style-dialog.component";
import { SharedTestingModule } from "src/app/testing/shared-testing.module";

describe("BeerStyleDialogComponent", () => {
  let component: BeerStyleDialogComponent;
  let fixture: ComponentFixture<BeerStyleDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BeerStyleDialogComponent],
      imports: [SharedTestingModule],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            beers: [],
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BeerStyleDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
