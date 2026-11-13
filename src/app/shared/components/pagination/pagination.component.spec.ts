import { ComponentFixture, TestBed } from "@angular/core/testing";

import { PaginationComponent } from "./pagination.component";
import { SharedTestingModule } from "src/app/testing/shared-testing.module";

describe("PaginationComponent", () => {
  let component: PaginationComponent;
  let fixture: ComponentFixture<PaginationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaginationComponent, SharedTestingModule],
    }).compileComponents();

    fixture = TestBed.createComponent(PaginationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  describe("page number windowing", () => {
    function setState(
      currentPage: number,
      itemsPerPage: number,
      totalItems: number,
    ): void {
      component.currentPage = currentPage;
      component.itemsPerPage = itemsPerPage;
      component.totalItems = totalItems;
      component.updatePageNumbers();
    }

    it("computes the last page by rounding up", () => {
      setState(1, 10, 95);
      expect(component.lastPage).toBe(10);
    });

    it("lists every page when they all fit", () => {
      setState(2, 10, 30);
      expect(component.pageNumbers).toEqual([1, 2, 3]);
    });

    it("collapses the middle with ellipses when pages are many", () => {
      setState(6, 10, 200);
      expect(component.pageNumbers).toEqual([
        1,
        "...",
        4,
        5,
        6,
        7,
        8,
        "...",
        20,
      ]);
    });

    it("does not add a leading ellipsis for the second page", () => {
      setState(2, 10, 200);
      expect(component.pageNumbers).toEqual([1, 2, 3, 4, "...", 20]);
    });

    it("does not add a trailing ellipsis on the penultimate page", () => {
      setState(19, 10, 200);
      expect(component.pageNumbers).toEqual([1, "...", 17, 18, 19, 20]);
    });

    it("handles an empty list without negative page numbers", () => {
      setState(1, 10, 0);
      expect(component.pageNumbers).toEqual([]);
    });
  });

  describe("navigation", () => {
    it("emits the previous page when not on the first page", () => {
      const spy = spyOn(component.pageChange, "emit");
      component.currentPage = 3;
      component.previousPage();
      expect(spy).toHaveBeenCalledWith(2);
    });

    it("does not emit a previous page when already on the first", () => {
      const spy = spyOn(component.pageChange, "emit");
      component.currentPage = 1;
      component.previousPage();
      expect(spy).not.toHaveBeenCalled();
    });

    it("does not emit a next page when already on the last", () => {
      const spy = spyOn(component.pageChange, "emit");
      component.currentPage = 5;
      component.itemsPerPage = 10;
      component.totalItems = 50;
      component.nextPage();
      expect(spy).not.toHaveBeenCalled();
    });

    it("jumps to the first and last pages", () => {
      const spy = spyOn(component.pageChange, "emit");
      component.itemsPerPage = 10;
      component.totalItems = 50;
      component.goToFirstPage();
      component.goToLastPage();
      expect(spy.calls.allArgs()).toEqual([[1], [5]]);
    });

    it("parses the selected page size into a number", () => {
      const spy = spyOn(component.itemsPerPageChange, "emit");
      const select = document.createElement("select");
      select.innerHTML = '<option value="25">25</option>';
      select.value = "25";
      component.changeItemsPerPage({ target: select } as unknown as Event);
      expect(spy).toHaveBeenCalledWith(25);
    });
  });
});
