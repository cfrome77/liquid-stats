import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import * as moment from 'moment';

@Component({
  selector: 'app-badges',
  templateUrl: './badges.component.html',
  styleUrls: ['./badges.component.css']
})
export class BadgesComponent implements OnInit {
  public badges: any[] = [];               // All badges fetched from the API
  public currentPage: number = 1;          // Default current page is 1
  public itemsPerPage: number = 10;        // Items per page
  public totalItems!: number;              // Total items
  public paginatedBadges: any[] = [];      // Paginated badges to display on current page

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.getJSON().subscribe((data) => {
      this.badges = data;
      this.totalItems = data.length;  // Set the total number of badges
      this.updatePagination();        // Set the initial paginated data
    });
  }

  // Fetch the badges JSON data from the API
  public getJSON(): Observable<any> {
    return this.http.get<any>('https://liquid-stats.s3.amazonaws.com/badges.json');
  }

  // Format the published date using Moment.js
  public published(createAt: string) {
    return moment(Date.parse(createAt)).format('h:mm A D MMM YYYY');
  }

  // Update the paginated badges based on the current page and items per page
  public updatePagination(): void {
    const maxPage = Math.ceil(this.totalItems / this.itemsPerPage);  // Calculate max page based on items per page
    // Adjust currentPage if it exceeds the max page
    if (this.currentPage > maxPage) {
      this.currentPage = maxPage;
    }
    const start = (this.currentPage - 1) * this.itemsPerPage;  // Start index for the current page
    const end = start + this.itemsPerPage;                      // End index for the current page
    this.paginatedBadges = this.badges.slice(start, end);       // Slice the badges array to show the correct items
  }

  // Handle the page change from the pagination component
  public onPageChange(page: number): void {
    this.currentPage = page;  // Set the current page
    this.updatePagination();  // Update the paginated badges based on the new page
  }

  // Handle change in items per page
  public onItemsPerPageChange(value: number): void {
    this.itemsPerPage = value;    // Set the items per page
    this.updatePagination();      // Update the paginated badges
  }
}
