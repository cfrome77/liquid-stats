import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import {
  BeerStyleDialogComponent,
  GenericBeersDialogData,
} from "./beer-style-dialog.component";

const beer = (name: string, brewery: string) => ({
  beerName: name,
  beerLabel: "",
  breweryName: brewery,
  beerABV: 5,
  rating: 4,
  checkInDate: "2026-04-06T21:00:00Z",
});

async function createDialog(
  data: Partial<GenericBeersDialogData>,
): Promise<ComponentFixture<BeerStyleDialogComponent>> {
  await TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [BeerStyleDialogComponent, MatDialogModule],
    providers: [{ provide: MAT_DIALOG_DATA, useValue: { beers: [], ...data } }],
  }).compileComponents();

  const fixture = TestBed.createComponent(BeerStyleDialogComponent);
  fixture.detectChanges();
  return fixture;
}

describe("BeerStyleDialogComponent", () => {
  let component: BeerStyleDialogComponent;
  let fixture: ComponentFixture<BeerStyleDialogComponent>;

  beforeEach(async () => {
    fixture = await createDialog({ beers: [] });
    component = fixture.componentInstance;
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("hides the search field when a single drink is listed", async () => {
    const single = await createDialog({ beers: [beer("Stone IPA", "Stone")] });
    const el = single.nativeElement as HTMLElement;

    expect(el.querySelector(".dialog-search-wrapper")).toBeNull();
    expect(el.querySelector("input[matinput]")).toBeNull();
    expect(el.textContent).toContain("Stone IPA");
  });

  it("shows the search field when several drinks are listed", async () => {
    const many = await createDialog({
      beers: [beer("Stone IPA", "Stone"), beer("Pilsner Urquell", "Plzen")],
    });
    const el = many.nativeElement as HTMLElement;

    expect(el.querySelector(".dialog-search-wrapper")).not.toBeNull();
    expect(el.querySelector("input")).not.toBeNull();
  });

  it("filters the list by drink or brewery once a term is entered", async () => {
    const many = await createDialog({
      beers: [beer("Stone IPA", "Stone"), beer("Pilsner Urquell", "Plzen")],
    });
    const instance = many.componentInstance;

    instance.searchTerm = "plzen";
    expect(instance.filteredBeers.length).toBe(1);
    expect(instance.filteredBeers[0]!.beerName).toBe("Pilsner Urquell");

    instance.searchTerm = "stone";
    expect(instance.filteredBeers.length).toBe(1);
    expect(instance.filteredBeers[0]!.beerName).toBe("Stone IPA");

    instance.searchTerm = "";
    expect(instance.filteredBeers.length).toBe(2);
  });
});
