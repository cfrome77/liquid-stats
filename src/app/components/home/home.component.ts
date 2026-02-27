import { Component, OnInit } from "@angular/core";
import { MatButtonModule } from "@angular/material/button";
import { RouterModule } from "@angular/router";

@Component({
  selector: "app-home",
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.css"],
  standalone: true,
  imports: [MatButtonModule, RouterModule],
})
export class HomeComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}
}
