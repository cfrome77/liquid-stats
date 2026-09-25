import {
  Component,
  Input,
  Output,
  EventEmitter,
  ViewChild,
  TemplateRef,
  ViewContainerRef,
  OnDestroy,
  inject,
} from "@angular/core";
import { Overlay, OverlayModule, OverlayRef } from "@angular/cdk/overlay";
import { TemplatePortal } from "@angular/cdk/portal";

import { MatButtonModule } from "@angular/material/button";
import { MatCheckboxModule } from "@angular/material/checkbox";
import {
  MatDatepickerModule,
  MatDatepickerInputEvent,
} from "@angular/material/datepicker";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { provideNativeDateAdapter } from "@angular/material/core";
import { FormsModule } from "@angular/forms";
import { MatIconModule } from "@angular/material/icon";
import { DateUtils } from "../../../core/utils/date-utils";

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
  standalone: true,
  imports: [
    OverlayModule,
    MatButtonModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    MatIconModule,
  ],
  providers: [provideNativeDateAdapter()],
})
export class FilterComponent implements OnDestroy {
  @Input() filterFields: FilterField[] = [];
  @Output() filterChanged = new EventEmitter<FilterField[]>();

  @ViewChild("filterModalTemplate") filterModalTemplate!: TemplateRef<unknown>;

  private overlay = inject(Overlay);
  private viewContainerRef = inject(ViewContainerRef);
  private overlayRef: OverlayRef | null = null;

  activeFilter: FilterField | null = null;
  isModalOpen = false;

  openFilterModal(filter: FilterField) {
    this.activeFilter = { ...filter, selected: [...filter.selected] };
    this.isModalOpen = true;

    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }

    this.overlayRef = this.overlay.create({
      hasBackdrop: true,
      backdropClass: "filter-modal-backdrop",
      positionStrategy: this.overlay
        .position()
        .global()
        .centerHorizontally()
        .centerVertically(),
      scrollStrategy: this.overlay.scrollStrategies.block(),
    });

    const portal = new TemplatePortal(
      this.filterModalTemplate,
      this.viewContainerRef,
    );
    this.overlayRef.attach(portal);

    this.overlayRef.backdropClick().subscribe(() => {
      this.closeModal();
    });

    this.overlayRef.keydownEvents().subscribe((event) => {
      if (event.key === "Escape") {
        this.closeModal();
      }
    });
  }

  closeModal() {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
    this.isModalOpen = false;
    this.activeFilter = null;
  }

  ngOnDestroy(): void {
    if (this.overlayRef) {
      this.overlayRef.dispose();
      this.overlayRef = null;
    }
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
      const localDate = DateUtils.toISODate(date);
      this.activeFilter.selected[0] = localDate;
    }
  }

  onDateToChange(event: MatDatepickerInputEvent<Date>) {
    const date = event.value;
    if (date && this.activeFilter) {
      const localDate = DateUtils.toISODate(date);
      this.activeFilter.selected[1] = localDate;
    }
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

  getFilterIcon(field: string): string {
    switch (field) {
      case "brewery":
        return "business";
      case "beer_style":
        return "sports_bar";
      case "country":
        return "public";
      case "state":
        return "location_on";
      case "rating":
        return "star";
      case "date":
        return "calendar_today";
      default:
        return "filter_alt";
    }
  }

  isFilterModified(filter: FilterField): boolean {
    if (filter.type === "date") {
      return (
        filter.selected[0] !== filter.options[0] ||
        filter.selected[1] !== filter.options[1]
      );
    }
    return filter.selected.length !== filter.options.length;
  }

  shouldShowOption(option: string): boolean {
    if (!this.activeFilter) return false;

    const count = this.activeFilter.countMap?.[option] ?? 0;
    if (count > 0) return true;

    const hasAnyMatches = Object.values(this.activeFilter.countMap || {}).some(
      (c) => c > 0,
    );
    if (!hasAnyMatches) {
      return true;
    }

    return this.activeFilter.selected.includes(option) && !this.allSelected;
  }
}
