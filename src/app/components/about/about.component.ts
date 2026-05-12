import { MatIconModule } from "@angular/material/icon";
import { Component } from "@angular/core";

import { MatDialogModule } from "@angular/material/dialog";
import { MatButtonModule } from "@angular/material/button";
import { PoweredByComponent } from "../../shared/components/powered-by/powered-by.component";

@Component({
  selector: "app-about",
  templateUrl: "./about.component.html",
  styleUrls: ["./about.component.css"],
  standalone: true,
  imports: [
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    PoweredByComponent,
  ],
})
export class AboutComponent {
  constructor() {}
}
