import { Component, inject } from "@angular/core";
import { FormsModule } from "@angular/forms";

import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatListModule } from "@angular/material/list";
import { MatIconModule } from "@angular/material/icon";
import { DateUtils } from "src/app/core/utils/date-utils";

export interface GenericBeersDialogData {
  title: string;
  beers: {
    beerName: string;
    beerLabel: string;
    breweryName: string;
    beerABV: number;
    rating: number;
    checkInDate: string;
    checkinUrl?: string;
  }[];
}

@Component({
  selector: "app-beer-style-dialog",
  templateUrl: "./beer-style-dialog.component.html",
  styleUrls: ["./beer-style-dialog.component.css"],
  standalone: true,
  imports: [
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatIconModule,
  ],
})
export class BeerStyleDialogComponent {
  data = inject<GenericBeersDialogData>(MAT_DIALOG_DATA);
  searchTerm = "";

  get filteredBeers() {
    if (!this.searchTerm.trim()) {
      return this.data.beers;
    }
    const term = this.searchTerm.toLowerCase();
    return this.data.beers.filter(
      (b) =>
        b.beerName.toLowerCase().includes(term) ||
        b.breweryName.toLowerCase().includes(term),
    );
  }

  formatDate(date: string): string {
    return DateUtils.formatTimestamp(date);
  }
}
