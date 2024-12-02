import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-filter',
  templateUrl: './filter.component.html',
  styleUrls: ['./filter.component.css']
})
export class FilterComponent {
  @Input() fieldName: string = '';  // The filter field name (e.g., "Style", "Brewery")
  @Input() options: string[] = [];  // The list of filter options (e.g., styles, breweries)
  @Input() selectedValues: string[] = [];  // The selected filter values
  @Output() filterChange = new EventEmitter<string[]>();  // Emit the updated selected values

  // This method is called when the user changes any checkbox
  onFilterChange(): void {
    this.filterChange.emit(this.selectedValues);
  }

  // Checks if the current option is selected
  isSelected(option: string): boolean {
    return this.selectedValues.includes(option);
  }
}
