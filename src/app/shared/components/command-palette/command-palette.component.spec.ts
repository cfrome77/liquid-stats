import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialogRef, MatDialogModule } from "@angular/material/dialog";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { Router } from "@angular/router";
import { of } from "rxjs";

import { CommandPaletteComponent } from "./command-palette.component";
import { BeerStoreService } from "src/app/core/services/beer-store.service";
import { BeerCheckin } from "src/app/core/models/beer.model";

describe("CommandPaletteComponent", () => {
  let component: CommandPaletteComponent;
  let fixture: ComponentFixture<CommandPaletteComponent>;
  let mockBeerStore: jasmine.SpyObj<BeerStoreService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<CommandPaletteComponent>>;

  const sampleBeers: BeerCheckin[] = [
    {
      beer: {
        bid: 101,
        beer_name: "Pilsner Urquell",
        beer_style: "Pilsner - Czech / German",
        beer_label: "http://example.com/pilsner.png",
        beer_abv: 4.4,
        beer_slug: "pilsner-urquell",
      },
      brewery: {
        brewery_id: 201,
        brewery_name: "Plzeňský Prazdroj",
        country_name: "Czech Republic",
        location: { brewery_state: "Plzeň" },
      },
      rating_score: 4.25,
      first_created_at: "2026-05-10 14:00:00",
      recent_created_at: "2026-05-15 18:00:00",
      recent_checkin_id: 12345,
      count: 3,
    },
  ];

  beforeEach(async () => {
    mockBeerStore = jasmine.createSpyObj("BeerStoreService", ["load"], {
      beers$: of(sampleBeers),
    });

    mockRouter = jasmine.createSpyObj("Router", ["navigate"]);
    mockDialogRef = jasmine.createSpyObj("MatDialogRef", ["close"]);

    await TestBed.configureTestingModule({
      imports: [
        CommandPaletteComponent,
        MatDialogModule,
        BrowserAnimationsModule,
      ],
      providers: [
        { provide: BeerStoreService, useValue: mockBeerStore },
        { provide: Router, useValue: mockRouter },
        { provide: MatDialogRef, useValue: mockDialogRef },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CommandPaletteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create and display default navigation pages when search term is empty", () => {
    expect(component).toBeTruthy();
    expect(component.results().length).toBeGreaterThan(0);
    expect(component.results()[0].type).toBe("page");
  });

  it("should filter results based on search term for drinks, breweries, and styles", () => {
    component.onSearchChange("pilsner");
    expect(component.results().length).toBeGreaterThan(0);
    const drinkResult = component.results().find((r) => r.type === "drink");
    expect(drinkResult).toBeTruthy();
    expect(drinkResult?.title).toBe("Pilsner Urquell");
  });

  it("should navigate to page when page result is selected", () => {
    const pageItem = component.pages[0];
    component.selectItem(pageItem);
    expect(mockDialogRef.close).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(["/"]);
  });
});
