import { Component } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Overlay } from "@angular/cdk/overlay";
import { AboutComponent } from "./components/about/about.component";
import { routes } from './app-routing.module';

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent {
  title = "liquid-stats";
  routes = routes;

  constructor(private dialog: MatDialog, private overlay: Overlay) {}

  openDialog() {
    const scrollStrategy = this.overlay.scrollStrategies.reposition();
    this.dialog.open(AboutComponent, {
      panelClass: "dialog",
      autoFocus: false,
      scrollStrategy,
    });
  }
}
