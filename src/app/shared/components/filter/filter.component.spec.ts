import { ComponentFixture, TestBed } from "@angular/core/testing";
import { NoopAnimationsModule } from "@angular/platform-browser/animations";
import { FilterComponent, FilterField } from "./filter.component";
import { OverlayContainer } from "@angular/cdk/overlay";
import { MatDatepickerInputEvent } from "@angular/material/datepicker";

describe("FilterComponent", () => {
  let component: FilterComponent;
  let fixture: ComponentFixture<FilterComponent>;
  let overlayContainer: OverlayContainer;
  let overlayContainerElement: HTMLElement;

  const sampleFilters: FilterField[] = [
    {
      field: "brewery",
      label: "Brewery",
      options: ["Brewery A", "Brewery B"],
      selected: ["Brewery A", "Brewery B"],
      countMap: { "Brewery A": 5, "Brewery B": 3 },
      type: "text",
    },
    {
      field: "date",
      label: "Date Range",
      options: ["2023-01-01", "2023-12-31"],
      selected: ["2023-01-01", "2023-12-31"],
      type: "date",
    },
    {
      field: "rating",
      label: "Rating",
      options: ["4.0", "4.5", "0.0"],
      selected: ["4.0", "4.5", "0.0"],
      type: "number",
    },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FilterComponent, NoopAnimationsModule],
    }).compileComponents();

    overlayContainer = TestBed.inject(OverlayContainer);
    overlayContainerElement = overlayContainer.getContainerElement();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(FilterComponent);
    component = fixture.componentInstance;
    component.filterFields = JSON.parse(JSON.stringify(sampleFilters));
    fixture.detectChanges();
  });

  afterEach(() => {
    overlayContainer.ngOnDestroy();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });

  it("should open filter modal overlay when button is clicked", () => {
    component.openFilterModal(component.filterFields[0]!);
    fixture.detectChanges();

    expect(component.isModalOpen).toBeTrue();
    expect(component.activeFilter?.field).toBe("brewery");

    const modalContent =
      overlayContainerElement.querySelector(".modal-content");
    expect(modalContent).toBeTruthy();
  });

  it("should close modal overlay when closeModal is called", () => {
    component.openFilterModal(component.filterFields[0]!);
    fixture.detectChanges();
    expect(
      overlayContainerElement.querySelector(".modal-content"),
    ).toBeTruthy();

    component.closeModal();
    fixture.detectChanges();

    expect(component.isModalOpen).toBeFalse();
    expect(component.activeFilter).toBeNull();
    expect(overlayContainerElement.querySelector(".modal-content")).toBeFalsy();
  });

  it("traps focus inside the modal while it is open", async () => {
    component.openFilterModal(component.filterFields[0]!);
    fixture.detectChanges();
    await fixture.whenStable();

    const modal = overlayContainerElement.querySelector(
      ".modal-content",
    ) as HTMLElement;
    expect(modal.getAttribute("role")).toBe("dialog");
    expect(modal.getAttribute("aria-modal")).toBe("true");

    // cdkTrapFocus inserts a start/end anchor pair around the trapped region,
    // which is what keeps Tab cycling within the dialog.
    const anchors = overlayContainerElement.querySelectorAll(
      ".cdk-focus-trap-anchor",
    );
    expect(anchors.length).toBe(2);
    for (const anchor of Array.from(anchors)) {
      expect(modal.parentElement?.contains(anchor)).toBeTrue();
    }
  });

  it("moves focus into the modal when it opens", async () => {
    component.openFilterModal(component.filterFields[0]!);
    fixture.detectChanges();
    await fixture.whenStable();
    await new Promise((resolve) => setTimeout(resolve));

    const modal = overlayContainerElement.querySelector(
      ".modal-content",
    ) as HTMLElement;
    expect(modal.contains(document.activeElement)).toBeTrue();
  });

  it("closes the modal when Escape is pressed", () => {
    component.openFilterModal(component.filterFields[0]!);
    fixture.detectChanges();
    expect(component.isModalOpen).toBeTrue();

    document.body.dispatchEvent(
      new KeyboardEvent("keydown", { key: "Escape", bubbles: true }),
    );
    fixture.detectChanges();

    expect(component.isModalOpen).toBeFalse();
    expect(overlayContainerElement.querySelector(".modal-content")).toBeFalsy();
  });

  it("should apply filter changes and emit filterChanged event", () => {
    spyOn(component.filterChanged, "emit");

    component.openFilterModal(component.filterFields[0]!);
    fixture.detectChanges();

    // Toggle selected options
    component.activeFilter!.selected = ["Brewery A"];
    component.applyFilter();

    expect(component.filterFields[0]!.selected).toEqual(["Brewery A"]);
    expect(component.filterChanged.emit).toHaveBeenCalledWith(
      component.filterFields,
    );
    expect(component.isModalOpen).toBeFalse();
  });

  it("should toggle select/deselect all options", () => {
    component.openFilterModal(component.filterFields[0]!);
    expect(component.allSelected).toBeTrue();

    component.toggleSelectDeselect();
    expect(component.activeFilter?.selected).toEqual([]);

    component.toggleSelectDeselect();
    expect(component.activeFilter?.selected).toEqual([
      "Brewery A",
      "Brewery B",
    ]);
  });

  it("should handle date change events", () => {
    component.openFilterModal(component.filterFields[1]!); // Date filter

    const fromEvent = {
      value: new Date(2023, 5, 15),
    } as MatDatepickerInputEvent<Date>;
    component.onDateFromChange(fromEvent);
    expect(component.activeFilter?.selected[0]).toBe("2023-06-15");

    const toEvent = {
      value: new Date(2023, 11, 20),
    } as MatDatepickerInputEvent<Date>;
    component.onDateToChange(toEvent);
    expect(component.activeFilter?.selected[1]).toBe("2023-12-20");
  });

  it("should format rating strings correctly", () => {
    expect(component.formatRating("0.0")).toBe("No Rating");
    expect(component.formatRating("4.25")).toBe("4.25");
    expect(component.formatRating("4.50")).toBe("4.5");
  });

  it("should return correct filter icons", () => {
    expect(component.getFilterIcon("brewery")).toBe("business");
    expect(component.getFilterIcon("beer_style")).toBe("sports_bar");
    expect(component.getFilterIcon("country")).toBe("public");
    expect(component.getFilterIcon("state")).toBe("location_on");
    expect(component.getFilterIcon("rating")).toBe("star");
    expect(component.getFilterIcon("date")).toBe("calendar_today");
    expect(component.getFilterIcon("unknown")).toBe("filter_alt");
  });

  it("should clean up overlayRef on ngOnDestroy", () => {
    component.openFilterModal(component.filterFields[0]!);
    fixture.detectChanges();
    expect(
      overlayContainerElement.querySelector(".modal-content"),
    ).toBeTruthy();

    component.ngOnDestroy();
    fixture.detectChanges();

    expect(overlayContainerElement.querySelector(".modal-content")).toBeFalsy();
  });
});
