import { Component, inject } from "@angular/core";

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
  imports: [MatDialogModule, MatButtonModule, MatListModule],
})
export class BeerStyleDialogComponent {
  data = inject<GenericBeersDialogData>(MAT_DIALOG_DATA);
}
