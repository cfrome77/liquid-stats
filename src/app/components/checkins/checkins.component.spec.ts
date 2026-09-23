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

  it("should correctly parse badge_image as string or object in transformCheckinData", () => {
    fixture.detectChanges();
    const mockCheckinObjImage = {
      checkin_id: 1,
      created_at: "Sun, 20 Sep 2026 00:11:10 +0000",
      checkin_comment: "Test Comment",
      rating_score: 4,
      beer: {
        bid: 101,
        beer_name: "Beer",
        beer_style: "Style",
        beer_label: "label.jpg",
        beer_slug: "beer",
      },
      brewery: {
        brewery_id: 201,
        brewery_name: "Brewery",
        brewery_label: "blabel.jpg",
        country_name: "USA",
      },
      badges: {
        items: [
          {
            badge_name: "Obj Badge",
            badge_image: {
              sm: "http://example.com/badge_sm.png",
              md: "http://example.com/badge_md.png",
              lg: "http://example.com/badge_lg.png",
            },
          },
          {
            badge_name: "String Badge",
            badge_image: "http://example.com/badge_str.png",
          },
        ],
      },
    };

    const cardData = component.transformCheckinData(mockCheckinObjImage);
    const badges = cardData.extraData?.badges;
    expect(badges).toBeDefined();
    expect(badges?.length).toBe(2);

    expect(badges![0].badge_image.sm).toBe("http://example.com/badge_sm.png");
    expect(badges![1].badge_image.sm).toBe("http://example.com/badge_str.png");
  });
});
