import { Component, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

import * as moment from "moment";

@Component({
  selector: "app-checkins",
  templateUrl: "./checkins.component.html",
  styleUrls: ["./checkins.component.css"],
})
export class CheckinsComponent implements OnInit {
  public checkins: any;

  constructor(private http: HttpClient) {
    this.getJSON().subscribe((data) => {
      this.checkins = data.response.checkins.items;
    });
  }

  ngOnInit(): void {}

  public getJSON(): Observable<any> {
    return this.http.get("https://liquid-stats.s3.amazonaws.com/checkins.json");
  }

  public published(createAt: string) {
    return moment(Date.parse(createAt)).format("h:mm A D MMM YYYY");
  }
}
