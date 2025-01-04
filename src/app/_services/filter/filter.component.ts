import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';

export interface FilterField {
  field: string;
  label: string;
  options: string[];
  selected: string[];
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
  isModalOpen: boolean = false;  // Flag to track if modal is open

  ngOnChanges(changes: SimpleChanges) {
    if (changes['filterFields'] && this.filterFields) {
      // Initialize all filters to have all options selected by default
      this.filterFields.forEach(filter => {
        if (!filter.selected || filter.selected.length === 0) {
          filter.selected = [...filter.options];
        }
      });
    }
  }

  // Open the modal for a specific filter
  openFilterModal(filter: FilterField) {
    this.isModalOpen = true;

    // Clone the filter to avoid direct manipulation of the original
    this.activeFilter = { ...filter, selected: [...filter.selected] };

    // Ensure all options are selected by default when the modal opens
    if (this.activeFilter.selected.length === 0) {
      this.activeFilter.selected = [...this.activeFilter.options];  // Select all options if nothing is selected
    }
  }

  // Close the modal without applying changes
  closeModal() {
    this.isModalOpen = false;
    this.activeFilter = null;  // Close the modal by resetting active filter
  }

  // Handle checkbox changes inside the modal
  onCheckboxChange(option: string, event: Event) {
    const checkbox = (event.target as HTMLInputElement);
    if (checkbox.checked) {
      // Add to selected if checked
      if (!this.activeFilter?.selected.includes(option)) {
        this.activeFilter?.selected.push(option);
      }
    } else {
      // Remove from selected if unchecked
      if (this.activeFilter?.selected.includes(option)) {
        this.activeFilter.selected = this.activeFilter.selected.filter(item => item !== option);
      }
    }
  }

  // Apply the selected filters
  applyFilter() {
    if (this.activeFilter) {
      // Update the parent component with the applied filters
      const filterIndex = this.filterFields.findIndex(filter => filter.field === this.activeFilter!.field);
      if (filterIndex !== -1) {
        this.filterFields[filterIndex] = { ...this.activeFilter }; // Apply changes to the original filter
      }
    }

    // Emit changes to parent component
    this.onFilterChange();
    this.closeModal();  // Close the modal after applying
  }

  // Emit the current filter changes to the parent component
  onFilterChange() {
    this.filterChanged.emit(this.filterFields);
  }

  // Toggle Select/Deselect All options
  toggleSelectDeselect() {
    if (this.activeFilter) {
      if (this.allSelected) {
        // Deselect all options
        this.activeFilter.selected = [];
      } else {
        // Select all options
        this.activeFilter.selected = [...this.activeFilter.options];
      }
    }
  }

  // Check if all options are selected
  get allSelected() {
    return this.activeFilter && this.activeFilter.selected.length === this.activeFilter.options.length;
  }

  // Handle reset: Deselect all and re-select all when needed
  resetSelections() {
    if (this.activeFilter) {
      this.activeFilter.selected = [...this.activeFilter.options];  // Re-select all options
    }
  }
}
