import {
  Component,
  OnInit,
  inject,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";

@Component({
  selector: "app-badge-dialog",
  templateUrl: "./badge-dialog.component.html",
  styleUrls: ["./badge-dialog.component.css"],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
})
export class BadgeDialogComponent implements OnInit {
  data = inject(MAT_DIALOG_DATA);

  // Angular's [innerHTML] sanitizer keeps <a>/<strong> and strips scripts,
  // so the description can be bound directly without a security bypass.
  public description = "";

  ngOnInit(): void {
    if (this.data.badge_description) {
      this.description = this.data.badge_description;
    }
  }
}
