import { Component, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

import * as moment from "moment";

@Component({
  selector: "app-topbeers",
  templateUrl: "./topbeers.component.html",
  styleUrls: ["./topbeers.component.css"],
})
export class TopbeersComponent implements OnInit {
  public beers: any;

  constructor(private http: HttpClient) {
    this.getJSON().subscribe((data) => {
      this.beers = data.beers;
    });
  }

  ngOnInit(): void {}

  public getJSON(): Observable<any> {
    return this.http.get("https://liquid-stats.s3.amazonaws.com/beers.json");
  }

  public published(createAt: string) {
    return moment(Date.parse(createAt)).format("h:mm A D MMM YYYY");
  }
}
