import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { BadgeDialogComponent } from "./badge-dialog.component";

describe("BadgeDialogComponent", () => {
  let component: BadgeDialogComponent;
  let fixture: ComponentFixture<BadgeDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BadgeDialogComponent],
      imports: [MatDialogModule],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: { badge_image: { md: "test.jpg" } },
        },
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
