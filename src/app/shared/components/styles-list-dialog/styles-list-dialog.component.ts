import { Component, inject } from "@angular/core";
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
  public data = inject<StylesListDialogData>(MAT_DIALOG_DATA);
  public dialogRef = inject(MatDialogRef<StylesListDialogComponent>);
  public searchTerm = "";

  get filteredStyles(): StyleItem[] {
    if (!this.searchTerm.trim()) {
      return this.data.styles;
    }
    const term = this.searchTerm.toLowerCase();
    return this.data.styles.filter((s) =>
      s.styleName.toLowerCase().includes(term),
    );
  }

  selectStyle(styleName: string): void {
    this.dialogRef.close(styleName);
  }
}
