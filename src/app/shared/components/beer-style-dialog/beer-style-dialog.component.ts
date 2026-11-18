import { Component, inject, ChangeDetectionStrategy } from "@angular/core";
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
  showBackButton?: boolean;
}

@Component({
  selector: "app-beer-style-dialog",
  templateUrl: "./beer-style-dialog.component.html",
  styleUrls: ["./beer-style-dialog.component.css"],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  /** Rows revealed per "Load more" tap. */
  readonly PAGE_SIZE = 25;

  data = inject<GenericBeersDialogData>(MAT_DIALOG_DATA);

  private _searchTerm = "";

  /** Caps the rendered rows so a long list stays quick to scan. */
  visibleCount = this.PAGE_SIZE;

  get searchTerm(): string {
    return this._searchTerm;
  }

  set searchTerm(value: string) {
    this._searchTerm = value;
    // A new search starts from the top of its own results.
    this.visibleCount = this.PAGE_SIZE;
  }

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

  /** The window of `filteredBeers` currently rendered. */
  get visibleBeers() {
    return this.filteredBeers.slice(0, this.visibleCount);
  }

  get hasMore(): boolean {
    return this.filteredBeers.length > this.visibleCount;
  }

  loadMore(): void {
    this.visibleCount += this.PAGE_SIZE;
  }

  formatDate(date: string): string {
    return DateUtils.formatTimestamp(date);
  }
}
