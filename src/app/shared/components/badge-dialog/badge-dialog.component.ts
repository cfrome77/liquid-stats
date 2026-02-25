import { Component, Inject, OnInit } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";

@Component({
  selector: "app-badge-dialog",
  templateUrl: "./badge-dialog.component.html",
  styleUrls: ["./badge-dialog.component.css"],
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
})
export class BadgeDialogComponent implements OnInit {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit(): void {}
}
