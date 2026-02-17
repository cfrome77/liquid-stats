import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";

import { BadgeDialogComponent } from "./badge-dialog.component";
import { SharedTestingModule } from "src/app/testing/shared-testing.module";

describe("BadgeDialogComponent", () => {
  let component: BadgeDialogComponent;
  let fixture: ComponentFixture<BadgeDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [BadgeDialogComponent],
      imports: [SharedTestingModule],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            badge_name: "Test Badge",
            badge_description: "Test description",
            created_at: new Date(),
            badge_image: {
              md: "test-image.jpg",
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
