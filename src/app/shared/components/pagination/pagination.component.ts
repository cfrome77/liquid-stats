import { Component, EventEmitter, Input, Output, SimpleChanges, OnChanges } from '@angular/core';

@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.css']
})
export class PaginationComponent implements OnChanges {
  @Input() currentPage: number = 1;              // The current page
  @Input() itemsPerPage: number = 10;             // Number of items per page
  @Input() totalItems: number = 0;                // Total number of items
  @Input() pageNumbers: (number | string)[] = []; // List of page numbers
  
  @Output() pageChange: EventEmitter<number> = new EventEmitter<number>();
  @Output() itemsPerPageChange: EventEmitter<number> = new EventEmitter<number>();

  // Lifecycle hook to handle changes to the inputs
  ngOnChanges(changes: SimpleChanges): void {
    if (changes.totalItems || changes.itemsPerPage || changes.currentPage) {
      this.updatePageNumbers(); // Update page numbers when inputs change
    }
  }

  // Calculate total number of pages
  get lastPage(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  // Calculate total number of pages
  get totalPages(): number {
    return Math.ceil(this.totalItems / this.itemsPerPage);
  }

  // Update the page numbers for pagination display
  updatePageNumbers(): void {
    const pageNumbers: (number | string)[] = [];
    const range = 2; // Number of pages to show before and after the current page

    // Ensure that the first and last pages are always displayed when necessary
    let startPage = Math.max(1, this.currentPage - range);
    let endPage = Math.min(this.lastPage, this.currentPage + range);

    // Add the first page if the startPage is greater than 1
    if (startPage > 1) {
      pageNumbers.push(1);
      if (startPage > 2) pageNumbers.push('...');
    }

    // Add pages in the range from startPage to endPage
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    // Add the last page if the endPage is less than lastPage
    if (endPage < this.lastPage) {
      if (endPage < this.lastPage - 1) pageNumbers.push('...');
      pageNumbers.push(this.lastPage);
    }

    // Update the pageNumbers array
    this.pageNumbers = pageNumbers;
  }

  // Navigate to the first page
  goToFirstPage(): void {
    this.pageChange.emit(1);
  }

  // Navigate to the previous page
  previousPage(): void {
    if (this.currentPage > 1) {
      this.pageChange.emit(this.currentPage - 1);
    }
  }

  // Navigate to the next page
  nextPage(): void {
    if (this.currentPage < this.lastPage) {
      this.pageChange.emit(this.currentPage + 1);
    }
  }

  // Navigate to the last page
  goToLastPage(): void {
    this.pageChange.emit(this.lastPage);
  }

  // Check if a value is a number
  isNumber(value: string | number): value is number {
    return typeof value === 'number';
  }

  // Navigate to a specific page
  goToPage(page: number): void {
    this.pageChange.emit(page);
  }

  // Emit the change in items per page
  changeItemsPerPage(event: any): void {
    const value = parseInt(event.target.value, 10);
    this.itemsPerPageChange.emit(value);
  }
}
