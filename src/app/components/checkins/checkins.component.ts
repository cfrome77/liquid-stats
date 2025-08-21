import { Component, OnInit } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { MatDialog } from '@angular/material/dialog';
import { BadgeDialogComponent } from '../../shared/components/badge-dialog/badge-dialog.component';

import * as moment from "moment";

@Component({
  selector: "app-checkins",
  templateUrl: "./checkins.component.html",
  styleUrls: ["./checkins.component.css"],
})
export class CheckinsComponent implements OnInit {
  public checkins: any;

  constructor(private http: HttpClient, private dialog: MatDialog) {
    this.getJSON().subscribe((data: { response: { checkins: { items: any; }; }; }) => {
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

  openBadgeDialog(badge: any): void {
    this.dialog.open(BadgeDialogComponent, {
      width: '400px',
      data: badge
    });
  }
}
