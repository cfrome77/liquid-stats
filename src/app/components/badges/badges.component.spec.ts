import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogModule } from "@angular/material/dialog";
import { of } from "rxjs";

import { BadgesComponent } from "./badges.component";
import { DataService } from "src/app/core/services/data.service";

describe("BadgesComponent", () => {
  let component: BadgesComponent;
  let fixture: ComponentFixture<BadgesComponent>;
  let mockDataService: any;

  beforeEach(async () => {
    mockDataService = {
      getBadges: () => of([]),
    };

    await TestBed.configureTestingModule({
      declarations: [BadgesComponent],
      imports: [HttpClientTestingModule, MatDialogModule],
      providers: [{ provide: DataService, useValue: mockDataService }],
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
