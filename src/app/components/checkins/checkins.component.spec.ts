import { MatIconModule } from "@angular/material/icon";
import { ComponentFixture, TestBed } from "@angular/core/testing";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatDialogModule } from "@angular/material/dialog";
import { of } from "rxjs";
import { CUSTOM_ELEMENTS_SCHEMA } from "@angular/core";
import { provideRouter } from "@angular/router"; // Import this

import { CheckinsComponent } from "./checkins.component";
import { DataService } from "src/app/core/services/data.service";

describe("CheckinsComponent", () => {
  let component: CheckinsComponent;
  let fixture: ComponentFixture<CheckinsComponent>;
  let mockDataService: Partial<DataService>;

  beforeEach(async () => {
    mockDataService = {
      getCheckins: () => of({ response: { checkins: { items: [] } } }),
    };

    await TestBed.configureTestingModule({
      imports: [
        MatIconModule,
        CheckinsComponent,
        HttpClientTestingModule,
        MatDialogModule,
      ],
      providers: [
        { provide: DataService, useValue: mockDataService },
        provideRouter([]),
      ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckinsComponent);
    component = fixture.componentInstance;
    // fixture.detectChanges(); // Sometimes moved inside the test to avoid early ngOnInit crashes
  });

  it("should create", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });
});
