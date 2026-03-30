import {
  Component,
  OnInit,
  Renderer2,
  Inject,
  OnDestroy,
  effect,
  NgZone,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { Overlay } from "@angular/cdk/overlay";
import { Router, NavigationEnd, RouterModule } from "@angular/router";
import { Subject } from "rxjs";
import { filter, takeUntil } from "rxjs/operators";
import { slideInAnimation } from "./animations";
import { AboutComponent } from "./components/about/about.component";
import { Ga4TrackingService } from "./core/services/ga4-tracking.service";
import { ThemeService } from "./core/services/theme.service";
import { DOCUMENT } from "@angular/common";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatDividerModule } from "@angular/material/divider";
import { ScrollToTopComponent } from "./shared/components/scroll-to-top/scroll-to-top.component";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatDialogModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatDividerModule,
    ScrollToTopComponent,
  ],
  animations: [slideInAnimation],
})
export class AppComponent implements OnInit, OnDestroy {
  title = "liquid-stats";
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
    private ngZone: NgZone,
  ) {
    // Consume the theme signal using an effect
    effect(() => {
      const theme = this.themeService.currentTheme();
      this.currentTheme = theme;
      this.applyTheme(theme);
    });
  }

  ngOnInit(): void {
    // Load and initialize GA4 when the browser is idle to improve initial page load performance
    this.ngZone.runOutsideAngular(() => {
      if ("requestIdleCallback" in window) {
        (window as any).requestIdleCallback(() => {
          this.ga4Service.loadAndInitialize();
        });
      } else {
        // Fallback for browsers that don't support requestIdleCallback
        setTimeout(() => {
          this.ga4Service.loadAndInitialize();
        }, 2000);
      }
    });

    // Subscribe to only NavigationEnd events for GA tracking
    this.ngZone.runOutsideAngular(() => {
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

  prepareRoute(outlet: any) {
    return (
      outlet &&
      outlet.activatedRouteData &&
      outlet.activatedRouteData["animation"]
    );
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
