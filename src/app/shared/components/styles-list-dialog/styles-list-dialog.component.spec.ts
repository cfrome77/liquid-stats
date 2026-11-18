import { ComponentFixture, TestBed } from "@angular/core/testing";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import {
  StyleItem,
  StylesListDialogComponent,
  StylesListDialogData,
} from "./styles-list-dialog.component";

const style = (name: string, count: number): StyleItem => ({
  styleName: name,
  count,
});

async function createDialog(
  data: Partial<StylesListDialogData>,
): Promise<ComponentFixture<StylesListDialogComponent>> {
  await TestBed.resetTestingModule();
  await TestBed.configureTestingModule({
    imports: [StylesListDialogComponent, MatDialogModule],
    providers: [
      { provide: MAT_DIALOG_DATA, useValue: { styles: [], ...data } },
      { provide: MatDialogRef, useValue: { close: () => {} } },
    ],
  }).compileComponents();

  const fixture = TestBed.createComponent(StylesListDialogComponent);
  fixture.detectChanges();
  return fixture;
}

describe("StylesListDialogComponent", () => {
  it("should create", async () => {
    const fixture = await createDialog({ styles: [] });
    expect(fixture.componentInstance).toBeTruthy();
  });

  it("filters the list by style name", async () => {
    const fixture = await createDialog({
      styles: [style("IPA", 10), style("Pilsner", 4)],
    });
    const instance = fixture.componentInstance;

    instance.searchTerm = "pils";
    expect(instance.filteredStyles.map((s) => s.styleName)).toEqual([
      "Pilsner",
    ]);

    instance.searchTerm = "";
    expect(instance.filteredStyles.length).toBe(2);
  });

  describe("long lists", () => {
    const manyStyles = (count: number) =>
      Array.from({ length: count }, (_, i) => style(`Style ${i}`, i + 1));

    it("renders only the first page of a long list", async () => {
      const fixture = await createDialog({ styles: manyStyles(80) });
      const el = fixture.nativeElement as HTMLElement;

      expect(fixture.componentInstance.visibleStyles.length).toBe(25);
      expect(el.querySelectorAll("li").length).toBe(25);
      expect(fixture.componentInstance.hasMore).toBe(true);
    });

    it("reveals another page on load more", async () => {
      const fixture = await createDialog({ styles: manyStyles(60) });
      const instance = fixture.componentInstance;

      instance.loadMore();
      fixture.detectChanges();
      expect(instance.visibleStyles.length).toBe(50);

      instance.loadMore();
      fixture.detectChanges();
      expect(instance.visibleStyles.length).toBe(60);
      expect(instance.hasMore).toBe(false);
    });

    it("reports how many of the total are shown", async () => {
      const fixture = await createDialog({ styles: manyStyles(80) });
      const el = fixture.nativeElement as HTMLElement;

      expect(el.querySelector(".dialog-list-count")?.textContent).toContain(
        "Showing 25 of 80",
      );
    });

    it("restarts the window from the top of a new search", async () => {
      const fixture = await createDialog({ styles: manyStyles(80) });
      const instance = fixture.componentInstance;

      instance.loadMore();
      expect(instance.visibleStyles.length).toBe(50);

      instance.searchTerm = "Style 1";
      expect(instance.visibleCount).toBe(instance.PAGE_SIZE);
    });

    it("has no footer when the list is empty", async () => {
      const fixture = await createDialog({ styles: [] });
      const el = fixture.nativeElement as HTMLElement;

      expect(el.querySelector(".dialog-list-footer")).toBeNull();
    });
  });
});
