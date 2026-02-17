import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogModule } from "@angular/material/dialog";
import { ReactiveFormsModule, FormsModule } from "@angular/forms";
import { MatRadioModule } from "@angular/material/radio";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatSelectModule } from "@angular/material/select";
import { MatInputModule } from "@angular/material/input";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { of } from "rxjs";

import { TopBeersComponent } from "./top-beers.component";
import { DataService } from "src/app/core/services/data.service";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";

describe("TopBeersComponent", () => {
  let component: TopBeersComponent;
  let fixture: ComponentFixture<TopBeersComponent>;
  let mockDataService: any;

  beforeEach(async () => {
    mockDataService = {
      getBeers: () => of({ beers: [] }),
    };

    await TestBed.configureTestingModule({
      declarations: [TopBeersComponent],
      imports: [
        HttpClientTestingModule,
        MatDialogModule,
        ReactiveFormsModule,
        FormsModule,
        MatRadioModule,
        MatFormFieldModule,
        MatSelectModule,
        MatInputModule,
        BrowserAnimationsModule,
      ],
      providers: [{ provide: DataService, useValue: mockDataService }],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(TopBeersComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
