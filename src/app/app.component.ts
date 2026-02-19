import { Component, OnInit, Renderer2, Inject, OnDestroy } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { Overlay } from "@angular/cdk/overlay";
import { Router, NavigationEnd } from "@angular/router";
import { Subject } from "rxjs";
import { filter, takeUntil } from "rxjs/operators";
import { AboutComponent } from "./components/about/about.component";
import { routes } from "./app-routing.module";
import { Ga4TrackingService } from "./core/services/ga4-tracking.service";
import { ThemeService } from "./core/services/theme.service";
import { DOCUMENT } from "@angular/common";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
  standalone: false,
})
export class AppComponent implements OnInit, OnDestroy {
  title = "liquid-stats";
  routes = routes;
  currentTheme: "light-theme" | "dark-theme" = "dark-theme";
  private destroy$ = new Subject<void>();

  constructor(
    private dialog: MatDialog,
    private overlay: Overlay,
    private router: Router,
    private ga4Service: Ga4TrackingService,
    private themeService: ThemeService,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document,
  ) {}

  ngOnInit(): void {
    // Load and initialize GA4
    this.ga4Service.loadAndInitialize();

    this.themeService.theme$
      .pipe(takeUntil(this.destroy$))
      .subscribe((theme) => {
        this.currentTheme = theme;
        this.applyTheme(theme);
      });

    // Subscribe to only NavigationEnd events for GA tracking
    this.router.events
      .pipe(
        filter(
          (event): event is NavigationEnd => event instanceof NavigationEnd,
        ),
        takeUntil(this.destroy$),
      )
      .subscribe((event) => {
        const newPath = event.urlAfterRedirects;
        const newTitle = document.title;

        this.ga4Service.trackPageView(newPath, newTitle);
      });
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  private applyTheme(theme: "light-theme" | "dark-theme"): void {
    const host = this.document.body;
    this.renderer.removeClass(host, "light-theme");
    this.renderer.removeClass(host, "dark-theme");
    this.renderer.addClass(host, theme);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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
