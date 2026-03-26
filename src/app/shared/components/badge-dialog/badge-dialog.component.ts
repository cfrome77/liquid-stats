import { Component, Inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { DomSanitizer, SafeHtml } from "@angular/platform-browser";

@Component({
  selector: "app-badge-dialog",
  templateUrl: "./badge-dialog.component.html",
  styleUrls: ["./badge-dialog.component.css"],
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
})
export class BadgeDialogComponent implements OnInit {
  public safeDescription: SafeHtml = "";

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
    if (this.data.badge_description) {
      this.safeDescription = this.sanitizer.bypassSecurityTrustHtml(
        this.data.badge_description,
      );
    }
  }
}
