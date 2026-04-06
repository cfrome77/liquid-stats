import { ComponentFixture, TestBed } from "@angular/core/testing";
import { TopBeersComponent } from "./top-beers.component";
import { HttpClientTestingModule } from "@angular/common/http/testing";
import { MatSelectModule } from "@angular/material/select";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { MatRadioModule } from "@angular/material/radio";
import { MatDialogModule } from "@angular/material/dialog";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { of } from "rxjs";
import { DataService } from "../../core/services/data.service";
import { ActivatedRoute } from "@angular/router";
import { RouterTestingModule } from "@angular/router/testing";

describe("TopBeersComponent", () => {
  let component: TopBeersComponent;
  let fixture: ComponentFixture<TopBeersComponent>;
  let mockDataService: any;

  beforeEach(async () => {
    mockDataService = jasmine.createSpyObj("DataService", [
      "getBeers",
      "getBeersAll",
    ]);
    const mockBeer = {
      beer: {
        beer_name: "Test Beer",
        beer_style: "IPA",
        beer_slug: "test-ipa",
        bid: 123,
        beer_label: "",
      },
      brewery: {
        brewery_name: "Test Brewery",
        brewery_label: "",
        brewery_id: 456,
        contact: { twitter: "test" },
      },
      rating_score: 4.5,
      recent_created_at: "2026-02-07",
    };
    mockDataService.getBeersAll.and.returnValue(of([mockBeer]));

    await TestBed.configureTestingModule({
      imports: [
        TopBeersComponent,
        HttpClientTestingModule,
        MatSelectModule,
        MatFormFieldModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatRadioModule,
        MatDialogModule,
        BrowserAnimationsModule,
        FormsModule,
        ReactiveFormsModule,
        RouterTestingModule,
      ],
      providers: [
        { provide: DataService, useValue: mockDataService },
        { provide: ActivatedRoute, useValue: { params: of({}) } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TopBeersComponent);
    component = fixture.componentInstance;
    // We don't need to manually set component.beers here because ngOnInit will call getBeers
  });

  it("should create", () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it("should filter beers", () => {
    fixture.detectChanges();
    expect(component.transformedTopBeers.length).toBeGreaterThan(0);
    expect(component.transformedTopBeers[0].title).toBe("Test Beer");
  });

  it("should correctly handle beers with count > 1 for minCheckins filter", () => {
    const multiCheckinBeer = {
      beer: {
        beer_name: "Multi Beer",
        beer_style: "Stout",
        bid: 789,
        beer_slug: "multi-beer",
        beer_label: "",
      },
      brewery: {
        brewery_name: "Multi Brewery",
        location: {},
        brewery_label: "",
        contact: {},
      },
      rating_score: 4.0,
      count: 3,
      recent_created_at: "2026-02-07",
    };
    mockDataService.getBeersAll.and.returnValue(of([multiCheckinBeer]));

    component.ngOnInit();
    component.minCheckins = 3;
    component.onFilterChange();
    fixture.detectChanges();

    expect(component.transformedTopBeers.length).toBe(1);
    expect(component.transformedTopBeers[0].title).toBe("Multi Beer");

    component.minCheckins = 5;
    component.onFilterChange();
    fixture.detectChanges();
    expect(component.transformedTopBeers.length).toBe(0);
  });
});
