import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import { MatDatepickerInputEvent } from "@angular/material/datepicker";

export interface FilterField {
  field: string;
  label: string;
  options: string[];
  selected: string[];
  countMap?: { [option: string]: number };
  type?: "text" | "date" | "number";
}

@Component({
  selector: "app-filter",
  templateUrl: "./filter.component.html",
  styleUrls: ["./filter.component.css"],
  standalone: false,
})
export class FilterComponent implements OnChanges {
  @Input() filterFields: FilterField[] = [];
  @Output() filterChanged = new EventEmitter<any>();

  activeFilter: FilterField | null = null;
  isModalOpen = false;

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges) {
    // No longer auto-filling selected options to allow hiding options with 0 matches
  }

  openFilterModal(filter: FilterField) {
    this.isModalOpen = true;
    this.activeFilter = { ...filter, selected: [...filter.selected] };
  }

  closeModal() {
    this.isModalOpen = false;
    this.activeFilter = null;
  }

  onCheckboxChange(option: string, event: Event) {
    const checkbox = event.target as HTMLInputElement;
    if (checkbox.checked) {
      if (!this.activeFilter?.selected.includes(option)) {
        this.activeFilter?.selected.push(option);
      }
    } else {
      if (this.activeFilter?.selected.includes(option)) {
        this.activeFilter.selected = this.activeFilter.selected.filter(
          (item) => item !== option,
        );
      }
    }
  }

  applyFilter() {
    if (this.activeFilter) {
      const filterIndex = this.filterFields.findIndex(
        (filter) => filter.field === this.activeFilter!.field,
      );
      if (filterIndex !== -1) {
        this.filterFields[filterIndex] = { ...this.activeFilter };
      }
    }

    this.onFilterChange();
    this.closeModal();
  }

  onFilterChange() {
    this.filterChanged.emit(this.filterFields);
  }

  onDateFromChange(event: MatDatepickerInputEvent<Date>) {
    const date = event.value;
    if (date && this.activeFilter) {
      const localDate = this.formatDateToYMD(date);
      this.activeFilter.selected[0] = localDate;
    }
  }

  onDateToChange(event: MatDatepickerInputEvent<Date>) {
    const date = event.value;
    if (date && this.activeFilter) {
      const localDate = this.formatDateToYMD(date);
      this.activeFilter.selected[1] = localDate;
    }
  }

  formatDateToYMD(date: Date): string {
    const year = date.getFullYear();
    const month = `${date.getMonth() + 1}`.padStart(2, "0");
    const day = `${date.getDate()}`.padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  toDate(dateStr: string): Date | null {
    return dateStr ? new Date(dateStr + "T00:00:00") : null;
  }

  toggleSelectDeselect() {
    if (this.activeFilter) {
      this.activeFilter.selected = this.allSelected
        ? []
        : [...this.activeFilter.options];
    }
  }

  get allSelected() {
    return (
      this.activeFilter &&
      this.activeFilter.selected.length === this.activeFilter.options.length
    );
  }

  resetSelections() {
    if (this.activeFilter) {
      this.activeFilter.selected = [...this.activeFilter.options];
    }
  }

  formatRating(value: string): string {
    if (value === "0.0" || value === "0.00") return "No Rating";
    const parsed = parseFloat(value);
    if (isNaN(parsed)) return value;
    return (parsed * 10) % 1 === 0 ? parsed.toFixed(1) : parsed.toFixed(2);
  }

  shouldShowOption(option: string): boolean {
    if (!this.activeFilter) return false;

    const count = this.activeFilter.countMap?.[option] ?? 0;
    if (count > 0) return true;

    // Check if any option in the current list has a count > 0.
    // We only hide zero-count options if there's at least one non-zero option to show.
    // This prevents the filter list from being completely empty.
    const hasAnyMatches = Object.values(this.activeFilter.countMap || {}).some(
      (c) => c > 0,
    );
    if (!hasAnyMatches) {
      return true;
    }

    // If count is 0, hide it to keep the list clean and only allow valid combinations.
    // However, if the user has specifically selected it (and not all are selected),
    // we show it so they can see their active filters and potentially unselect it.
    return this.activeFilter.selected.includes(option) && !this.allSelected;
  }
}
