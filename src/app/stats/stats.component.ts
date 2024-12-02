import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';  // Import HttpClient
import { Observable } from 'rxjs';  // Import Observable for HTTP requests

import * as moment from 'moment';

@Component({
  selector: 'app-stats',
  templateUrl: './stats.component.html',
  styleUrls: ['./stats.component.css']
})
export class StatsComponent implements OnInit {
  public beers: any[] = [];  // Declare beers array
  public paginatedBeers: any[] = [];  // Declare paginatedBeers array
  public currentPage: number = 1;  // Initial page
  public itemsPerPage: number = 10;  // Default number of items per page
  public totalItems: number = 0;  // Total number of beers

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.fetchBeersData();  // Fetch the beer data when the component initializes
  }

  // Function to fetch beer data from the provided URL
  public fetchBeersData(): void {
    this.getJSON().subscribe((data) => {
      // Check if the data contains beers
      if (data && data.beers && Array.isArray(data.beers)) {
        // Initialize badges if not already set
        data.beers.forEach((beer: { badges: {}; }) => {
          beer.badges = beer.badges || {};  // Initialize badges if undefined
        });
        this.beers = data.beers;  // Set the beers data
        this.totalItems = this.beers.length;  // Set the total number of items for pagination
        this.updatePaginatedBeers();  // Update the paginated beers after data is loaded
      } else {
        console.error('Invalid data structure:', data);  // Log an error if data structure is not as expected
      }
    });
  }

  // Function to retrieve JSON data using HttpClient
  public getJSON(): Observable<any> {
    return this.http.get('https://liquid-stats.s3.amazonaws.com/beers.json');  // URL of your JSON data
  }

  // Function to format the publication date of a beer
  public published(createAt: string): string {
    return moment(Date.parse(createAt)).format('h:mm A D MMM YYYY');  // Format using moment.js
  }

  // Update the paginated beers based on the current page and items per page
  updatePaginatedBeers(): void {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;  // Calculate the starting index
    const endIndex = startIndex + this.itemsPerPage;  // Calculate the ending index
    this.paginatedBeers = this.beers.slice(startIndex, endIndex);  // Slice the beers for pagination
  }

  // Handle page navigation
  goToPage(page: number): void {
    this.currentPage = page;  // Update the current page
    this.updatePaginatedBeers();  // Update the paginated beers for the new page
  }

  // Handle items per page change
  changeItemsPerPage(itemsPerPage: number): void {
    const maxPage = Math.ceil(this.totalItems / itemsPerPage);  // Calculate the maximum page number
    // If the current page exceeds the max page, reset to the last valid page
    if (this.currentPage > maxPage) {
      this.currentPage = maxPage;
    }
    this.itemsPerPage = itemsPerPage;  // Update the number of items per page
    this.updatePaginatedBeers();  // Update the paginated beers with the new items per page
  }
}
