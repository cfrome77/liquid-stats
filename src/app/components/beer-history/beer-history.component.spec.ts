import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { RouterTestingModule } from "@angular/router/testing";
import { MatDialogModule } from "@angular/material/dialog";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { of } from "rxjs";

import { BeerHistoryComponent } from "./beer-history.component";
import { DataService } from "src/app/core/services/data.service";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";

describe("BeerHistoryComponent", () => {
  let component: BeerHistoryComponent;
  let fixture: ComponentFixture<BeerHistoryComponent>;
  let mockDataService: any;

  beforeEach(async () => {
    mockDataService = {
      getBeers: () => of([]),
    };

    await TestBed.configureTestingModule({
      declarations: [BeerHistoryComponent],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        MatDialogModule,
        ReactiveFormsModule,
        FormsModule,
      ],
      providers: [{ provide: DataService, useValue: mockDataService }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BeerHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
