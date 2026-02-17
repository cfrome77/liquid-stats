import { Component, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Overlay } from "@angular/cdk/overlay";
import { Router, NavigationEnd } from "@angular/router";
import { filter } from "rxjs/operators";
import { AboutComponent } from "./components/about/about.component";
import { routes } from "./app-routing.module";
import { Ga4TrackingService } from "./core/services/ga4-tracking.service";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
})
export class AppComponent implements OnInit {
  title = "liquid-stats";
  routes = routes;

  constructor(
    private dialog: MatDialog,
    private overlay: Overlay,
    private router: Router,
    private ga4Service: Ga4TrackingService,
  ) {}

  ngOnInit(): void {
    // Load and initialize GA4
    this.ga4Service.loadAndInitialize();

    // Subscribe to only NavigationEnd events for GA tracking
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
      )
      .subscribe((event) => {
        const newPath = event.urlAfterRedirects;
        const newTitle = document.title;

        this.ga4Service.trackPageView(newPath, newTitle);
      });
  }

  openDialog(): void {
    const scrollStrategy = this.overlay.scrollStrategies.reposition();

    this.dialog.open(AboutComponent, {
      panelClass: "about-dialog-panel",
      autoFocus: false,
      scrollStrategy,

      width: "95vw",
      maxWidth: "750px",
      maxHeight: "85vh",

      enterAnimationDuration: "250ms",
      exitAnimationDuration: "200ms",
    });
  }
}
