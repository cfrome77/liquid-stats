import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogModule } from "@angular/material/dialog";
import { of } from "rxjs";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";

import { CheckinsComponent } from "./checkins.component";
import { DataService } from "src/app/core/services/data.service";

describe("CheckinsComponent", () => {
  let component: CheckinsComponent;
  let fixture: ComponentFixture<CheckinsComponent>;
  let mockDataService: any;

  beforeEach(async () => {
    mockDataService = {
      getCheckins: () =>
        of({ response: { checkins: { items: [] } } }),
    };

    await TestBed.configureTestingModule({
      declarations: [CheckinsComponent],
      imports: [HttpClientTestingModule, MatDialogModule],
      providers: [{ provide: DataService, useValue: mockDataService }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
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
