import { Component, Inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatListModule } from "@angular/material/list";

export interface GenericBeersDialogData {
  title: string;
  beers: {
    beerName: string;
    beerLabel: string;
    breweryName: string;
    beerABV: number;
    rating: number;
    checkInDate: string;
  }[];
}

@Component({
  selector: "app-beer-style-dialog",
  templateUrl: "./beer-style-dialog.component.html",
  styleUrls: ["./beer-style-dialog.component.css"],
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatListModule],
})
export class BeerStyleDialogComponent implements OnInit {
  constructor(@Inject(MAT_DIALOG_DATA) public data: GenericBeersDialogData) {}

  ngOnInit(): void {}
}
