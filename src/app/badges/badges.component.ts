import { Component, OnInit } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import * as moment from "moment";

@Component({
  selector: 'app-badges',
  templateUrl: './badges.component.html',
  styleUrls: ['./badges.component.css']
})
export class BadgesComponent implements OnInit {
  public badges: any;
  public currentPage: number = 1;  // Default current page is 1
  public itemsPerPage: number = 10;  // Items to display per page
  public totalItems!: number;  // Total items will be calculated after fetching data
  public lastPage!: number;  // Last page number calculated dynamically
  public paginatedBadges: any[] = [];
  public pageNumbers: (number | string)[] = []; // This will store page numbers and '...'

  constructor(private http: HttpClient) {
    this.getJSON().subscribe((data) => {
      this.badges = data;
      this.totalItems = data.length;  // Set the total number of badges
      this.lastPage = Math.ceil(this.totalItems / this.itemsPerPage);  // Calculate the last page
      this.updatePaginatedBadges();  // Update the badges shown on the current page
      this.updatePagination();  // Update the page numbers shown
    });
  }

  ngOnInit(): void { }

  // Fetch the badges JSON data from the API
  public getJSON(): Observable<any> {
    return this.http.get("https://liquid-stats.s3.amazonaws.com/badges.json");
  }

  // Format the published date using Moment.js
  public published(createAt: string) {
    return moment(Date.parse(createAt)).format("h:mm A D MMM YYYY");
  }

  // Update the list of badges shown on the current page
  public updatePaginatedBadges() {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedBadges = this.badges.slice(startIndex, startIndex + this.itemsPerPage);
  }

  // Update the pagination numbers to show
  public updatePagination() {
    const totalPages = this.lastPage;
    const pages = [];

    // Calculate page numbers with ellipses
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= this.currentPage - 2 && i <= this.currentPage + 2)) {
        pages.push(i);
      } else if (pages[pages.length - 1] !== '...') {
        pages.push('...');
      }
    }

    this.pageNumbers = pages;
  }

  // Method to check if the page is a valid number
  public isNumber(value: string | number): value is number {
    return typeof value === 'number';
  }

  // Method to go to a specific page number (already exists in your code)
  public goToPage(page: number): void {
    if (page > 0 && page <= this.lastPage) {
      this.currentPage = page;
      this.updatePaginatedBadges();
      this.updatePagination();
    }
  }

  // New helper method that calls goToPage only if page is a valid number
  public goToPageIfValid(page: string | number): void {
    if (this.isNumber(page)) {
      this.goToPage(page as number); // Ensure the page is treated as a number
    }
  }

  // Go to the previous page
  public previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePaginatedBadges();
      this.updatePagination();
    }
  }

  // Go to the next page
  public nextPage() {
    if (this.currentPage < this.lastPage) {
      this.currentPage++;
      this.updatePaginatedBadges();
      this.updatePagination();
    }
  }

  // Go to the first page
  public goToFirstPage() {
    this.currentPage = 1;
    this.updatePaginatedBadges();
    this.updatePagination();
  }

  // Go to the last page
  public goToLastPage() {
    this.currentPage = this.lastPage;
    this.updatePaginatedBadges();
    this.updatePagination();
  }

  // Change how many items to display per page
  public changeItemsPerPage(event: any) {
    this.itemsPerPage = parseInt(event.target.value, 10);
    this.lastPage = Math.ceil(this.totalItems / this.itemsPerPage);
    this.currentPage = 1;  // Reset to the first page after changing items per page
    this.updatePaginatedBadges();
    this.updatePagination();
  }
}
