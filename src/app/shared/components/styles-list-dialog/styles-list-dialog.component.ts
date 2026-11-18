import { Component, inject, ChangeDetectionStrategy } from "@angular/core";
import { FormsModule } from "@angular/forms";
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatListModule } from "@angular/material/list";
import { MatIconModule } from "@angular/material/icon";

export interface StyleItem {
  styleName: string;
  count: number;
}

export interface StylesListDialogData {
  title: string;
  styles: StyleItem[];
}

@Component({
  selector: "app-styles-list-dialog",
  templateUrl: "./styles-list-dialog.component.html",
  styleUrls: ["./styles-list-dialog.component.css"],
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
export class StylesListDialogComponent {
  /** Rows revealed per "Load more" tap. */
  readonly PAGE_SIZE = 25;

  public data = inject<StylesListDialogData>(MAT_DIALOG_DATA);
  public dialogRef = inject(MatDialogRef<StylesListDialogComponent>);

  private _searchTerm = "";

  /** Caps the rendered rows so a long list stays quick to scan. */
  public visibleCount = this.PAGE_SIZE;

  public get searchTerm(): string {
    return this._searchTerm;
  }

  public set searchTerm(value: string) {
    this._searchTerm = value;
    // A new search starts from the top of its own results.
    this.visibleCount = this.PAGE_SIZE;
  }

  public get filteredStyles(): StyleItem[] {
    if (!this.searchTerm.trim()) {
      return this.data.styles;
    }
    const term = this.searchTerm.toLowerCase();
    return this.data.styles.filter((s) =>
      s.styleName.toLowerCase().includes(term),
    );
  }

  /** The window of `filteredStyles` currently rendered. */
  public get visibleStyles(): StyleItem[] {
    return this.filteredStyles.slice(0, this.visibleCount);
  }

  public get hasMore(): boolean {
    return this.filteredStyles.length > this.visibleCount;
  }

  public loadMore(): void {
    this.visibleCount += this.PAGE_SIZE;
  }

  selectStyle(styleName: string): void {
    this.dialogRef.close(styleName);
  }
}
