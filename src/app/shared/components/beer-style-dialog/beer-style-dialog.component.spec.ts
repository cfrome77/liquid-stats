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

  describe("long lists", () => {
    const manyBeers = (count: number) =>
      Array.from({ length: count }, (_, i) =>
        beer(`Beer ${i}`, `Brewery ${i}`),
      );

    it("renders only the first page of a long list", async () => {
      const fixture = await createDialog({ beers: manyBeers(120) });
      const el = fixture.nativeElement as HTMLElement;

      expect(fixture.componentInstance.visibleBeers.length).toBe(25);
      expect(el.querySelectorAll("li").length).toBe(25);
      expect(fixture.componentInstance.hasMore).toBe(true);
    });

    it("shows the whole list when it fits on one page", async () => {
      const fixture = await createDialog({ beers: manyBeers(10) });
      const el = fixture.nativeElement as HTMLElement;

      expect(fixture.componentInstance.visibleBeers.length).toBe(10);
      expect(el.querySelectorAll("li").length).toBe(10);
      expect(fixture.componentInstance.hasMore).toBe(false);
    });

    it("reveals another page on load more", async () => {
      const fixture = await createDialog({ beers: manyBeers(60) });
      const instance = fixture.componentInstance;

      instance.loadMore();
      fixture.detectChanges();

      expect(instance.visibleBeers.length).toBe(50);
      expect(instance.hasMore).toBe(true);

      instance.loadMore();
      fixture.detectChanges();

      expect(instance.visibleBeers.length).toBe(60);
      expect(instance.hasMore).toBe(false);
    });

    it("reports how many of the total are shown", async () => {
      const fixture = await createDialog({ beers: manyBeers(120) });
      const el = fixture.nativeElement as HTMLElement;

      expect(el.querySelector(".dialog-list-count")?.textContent).toContain(
        "Showing 25 of 120",
      );

      fixture.componentInstance.loadMore();
      fixture.detectChanges();

      expect(el.querySelector(".dialog-list-count")?.textContent).toContain(
        "Showing 50 of 120",
      );
    });

    it("hides the load more button once everything is shown", async () => {
      const fixture = await createDialog({ beers: manyBeers(30) });
      const el = fixture.nativeElement as HTMLElement;

      const findLoadMore = () =>
        Array.from(el.querySelectorAll("button")).find((b) =>
          b.textContent?.includes("Load more"),
        );

      expect(findLoadMore()).toBeTruthy();

      fixture.componentInstance.loadMore();
      fixture.detectChanges();

      expect(findLoadMore()).toBeFalsy();
    });

    it("restarts the window from the top of a new search", async () => {
      const fixture = await createDialog({ beers: manyBeers(120) });
      const instance = fixture.componentInstance;

      instance.loadMore();
      instance.loadMore();
      expect(instance.visibleBeers.length).toBe(75);

      instance.searchTerm = "Beer 1";

      // A search always starts at the first page, not 75 rows in.
      expect(instance.visibleCount).toBe(instance.PAGE_SIZE);
    });

    it("has no footer when the list is empty", async () => {
      const fixture = await createDialog({ beers: [] });
      const el = fixture.nativeElement as HTMLElement;

      expect(el.querySelector(".dialog-list-footer")).toBeNull();
    });
  });
});
