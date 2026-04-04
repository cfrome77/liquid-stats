import {
  Component,
  OnInit,
  Renderer2,
  OnDestroy,
  effect,
  NgZone,
  inject,
} from "@angular/core";

import {
  Router,
  NavigationEnd,
  RouterModule,
  RouterOutlet,
} from "@angular/router";
import { Subject } from "rxjs";
import { filter, takeUntil } from "rxjs/operators";
import { slideInAnimation } from "./animations";
import { Ga4TrackingService } from "./core/services/ga4-tracking.service";
import { ThemeService } from "./core/services/theme.service";
import { DOCUMENT } from "@angular/common";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatDividerModule } from "@angular/material/divider";
import { ScrollToTopComponent } from "./shared/components/scroll-to-top/scroll-to-top.component";
import { InfoFabComponent } from "./shared/components/info-fab/info-fab.component";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
  standalone: true,
  imports: [
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatDividerModule,
    ScrollToTopComponent,
    InfoFabComponent,
  ],
  animations: [slideInAnimation],
})
export class AppComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private ga4Service = inject(Ga4TrackingService);
  private themeService = inject(ThemeService);
  private renderer = inject(Renderer2);
  private document = inject<Document>(DOCUMENT);
  private ngZone = inject(NgZone);

  title = "liquid-stats";
  currentTheme: "light-theme" | "dark-theme" = "dark-theme";
  private destroy$ = new Subject<void>();

  constructor() {
    effect(() => {
      const theme = this.themeService.currentTheme();
      this.currentTheme = theme;
      this.applyTheme(theme);
    });
  }

  ngOnInit(): void {
    this.ngZone.runOutsideAngular(() => {
      if ("requestIdleCallback" in window) {
        (
          window as { requestIdleCallback: (callback: () => void) => void }
        ).requestIdleCallback(() => {
          this.ga4Service.loadAndInitialize();
        });
      } else {
        setTimeout(() => {
          this.ga4Service.loadAndInitialize();
        }, 2000);
      }
    });

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

  // Fixed: Replaced 'any' with 'RouterOutlet'
  prepareRoute(outlet: RouterOutlet) {
    return (
      outlet &&
      outlet.activatedRouteData &&
      outlet.activatedRouteData["animation"]
    );
  }
}
