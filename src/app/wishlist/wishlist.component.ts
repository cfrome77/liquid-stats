import { Component, OnInit } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";


import * as moment from "moment";

@Component({
  selector: 'app-wishlist',
  templateUrl: './wishlist.component.html',
  styleUrls: ['./wishlist.component.css']
})
export class WishlistComponent implements OnInit {
  public wishlist: any;

  constructor(private http: HttpClient) {
    this.getJSON().subscribe((data) => {
      this.wishlist = data.response.beers.items;
    });
  }

  ngOnInit(): void {}

  public getJSON(): Observable<any> {
    return this.http.get("../assets/wishlist.json");
  }

  public published(createAt: string) {
    return moment(Date.parse(createAt)).format("h:mm A D MMM YYYY");
  }

}
