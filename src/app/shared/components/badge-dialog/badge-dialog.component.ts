import { Component, Inject, OnInit } from "@angular/core";
import { MAT_DIALOG_DATA } from "@angular/material/dialog";

@Component({
  selector: "app-badge-dialog",
  templateUrl: "./badge-dialog.component.html",
  styleUrls: ["./badge-dialog.component.css"],
})
export class BadgeDialogComponent implements OnInit {
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {}

  ngOnInit(): void {}
}
