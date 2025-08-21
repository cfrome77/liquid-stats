import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { MatDatepickerInputEvent } from '@angular/material/datepicker';

export interface FilterField {
  field: string;
  label: string;
  options: string[];
  selected: string[];
  countMap?: { [option: string]: number };
  type?: 'text' | 'date' | 'number';
}

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.css']
})
export class FilterComponent implements OnChanges {
  @Input() filterFields: FilterField[] = [];
  @Output() filterChanged = new EventEmitter<any>();

  activeFilter: FilterField | null = null;
  isModalOpen: boolean = false;

  ngOnInit(): void { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['filterFields'] && this.filterFields) {
      this.filterFields.forEach(filter => {
        if (!filter.selected || filter.selected.length === 0) {
          filter.selected = [...filter.options];
        }
      });
    }
  }

  openFilterModal(filter: FilterField) {
    this.isModalOpen = true;
    this.activeFilter = { ...filter, selected: [...filter.selected] };
    if (this.activeFilter.selected.length === 0) {
      this.activeFilter.selected = [...this.activeFilter.options];
    }
  }

  closeModal() {
    this.isModalOpen = false;
    this.activeFilter = null;
  }

  onCheckboxChange(option: string, event: Event) {
    const checkbox = (event.target as HTMLInputElement);
    if (checkbox.checked) {
      if (!this.activeFilter?.selected.includes(option)) {
        this.activeFilter?.selected.push(option);
      }
    } else {
      if (this.activeFilter?.selected.includes(option)) {
        this.activeFilter.selected = this.activeFilter.selected.filter(item => item !== option);
      }
    }
  }

  applyFilter() {
    if (this.activeFilter) {
      const filterIndex = this.filterFields.findIndex(filter => filter.field === this.activeFilter!.field);
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
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    const day = `${date.getDate()}`.padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  toDate(dateStr: string): Date | null {
    return dateStr ? new Date(dateStr + 'T00:00:00') : null;
  }

  toggleSelectDeselect() {
    if (this.activeFilter) {
      this.activeFilter.selected = this.allSelected ? [] : [...this.activeFilter.options];
    }
  }

  get allSelected() {
    return this.activeFilter && this.activeFilter.selected.length === this.activeFilter.options.length;
  }

  resetSelections() {
    if (this.activeFilter) {
      this.activeFilter.selected = [...this.activeFilter.options];
    }
  }

  formatRating(value: string): string {
    if (value === '0.0' || value === '0.00') return 'No Rating';
    const parsed = parseFloat(value);
    if (isNaN(parsed)) return value;
    return Number.isInteger(parsed * 100) && parsed * 10 % 10 === 0
      ? parsed.toFixed(1)
      : parsed.toFixed(2);
  }
}
