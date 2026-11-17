import {
  Component,
  OnInit,
  Renderer2,
  effect,
  NgZone,
  inject,
  ChangeDetectorRef,
  HostListener,
  DestroyRef,
} from "@angular/core";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";

import { Router, NavigationEnd, RouterModule } from "@angular/router";
import { filter } from "rxjs/operators";
import { slideInAnimation } from "./animations";
import { Ga4TrackingService } from "./core/services/ga4-tracking.service";
import { ThemeService } from "./core/services/theme.service";
import {
  NotificationService,
  NOTIFICATION_DEFAULT_DURATION,
} from "./core/services/notification.service";
import { DOCUMENT, CommonModule } from "@angular/common";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatDividerModule } from "@angular/material/divider";
import { MatDialog, MatDialogModule } from "@angular/material/dialog";
import { MatSnackBar, MatSnackBarModule } from "@angular/material/snack-bar";
import { SwUpdate, VersionReadyEvent } from "@angular/service-worker";
import { ScrollToTopComponent } from "./shared/components/scroll-to-top/scroll-to-top.component";
import { InfoFabComponent } from "./shared/components/info-fab/info-fab.component";
import { BeerStoreService } from "./core/services/beer-store.service";
import { NavItem } from "./core/models/nav-item.model";

@Component({
  selector: "app-root",
  templateUrl: "./app.component.html",
  styleUrls: ["./app.component.css"],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatSidenavModule,
    MatDividerModule,
    MatDialogModule,
    MatSnackBarModule,
    ScrollToTopComponent,
    InfoFabComponent,
  ],
  animations: [slideInAnimation],
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  private ga4Service = inject(Ga4TrackingService);
  private themeService = inject(ThemeService);
  private renderer = inject(Renderer2);
  private document = inject<Document>(DOCUMENT);
  private ngZone = inject(NgZone);
  private beerStore = inject(BeerStoreService);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private notifications = inject(NotificationService);
  private swUpdate = inject(SwUpdate, { optional: true });
  private destroyRef = inject(DestroyRef);

  title = "liquid-stats";
  // Single source of truth for the desktop, mobile-bottom, and drawer navigation.
  readonly navItems: NavItem[] = [
    {
      path: "/checkins",
      label: "Checkins",
      shortLabel: "Checkins",
      icon: "room",
    },
    {
      path: "/top-beers",
      label: "Top Drinks",
      shortLabel: "Top",
      icon: "emoji_events",
    },
    { path: "/badges", label: "Badges", shortLabel: "Badges", icon: "badge" },
    { path: "/map", label: "Map", shortLabel: "Map", icon: "map" },
    {
      path: "/beer-history",
      label: "History",
      shortLabel: "History",
      icon: "history",
    },
    {
      path: "/stats",
      label: "Stats",
      shortLabel: "Stats",
      icon: "insert_chart",
    },
    {
      path: "/insights",
      label: "Insights",
      shortLabel: "Insights",
      icon: "insights",
    },
    {
      path: "/wishlist",
      label: "Wishlist",
      shortLabel: "Wishlist",
      icon: "list",
    },
  ];
  readonly mobileNavItems: NavItem[] = [
    {
      path: "/",
      label: "Home",
      shortLabel: "Home",
      icon: "home",
      exact: true,
    },
    ...this.navItems.filter((item) => item.path !== "/badges"),
  ];
  currentTheme: "light-theme" | "dark-theme" = "dark-theme";
  hasLoadError = false;
  private hasAnnouncedLoadError = false;

  constructor() {
    this.beerStore.load();

    // Consume the theme signal using an effect
    effect(() => {
      const theme = this.themeService.currentTheme();
      this.currentTheme = theme;
      this.applyTheme(theme);
    });
  }

  ngOnInit(): void {
    // Listen for data load errors
    this.beerStore.loadError$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((err) => {
        this.hasLoadError = err;
        this.announceLoadError(err);
        this.cdr.detectChanges();
      });

    // Load and initialize GA4 when the browser is idle to improve initial page load performance
    this.ngZone.runOutsideAngular(() => {
      if ("requestIdleCallback" in window) {
        window.requestIdleCallback(() => {
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
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe((event) => {
          const newPath = event.urlAfterRedirects;
          const newTitle = document.title;

          this.ga4Service.trackPageView(newPath, newTitle);
        });
    });

    this.watchForAppUpdates();
  }

  /**
   * Raises a one-shot toast the first time the store reports a failure, with a
   * retry action. Repeated failures (each stream sets the same flag) do not
   * stack duplicate toasts; the persistent banner stays visible instead.
   */
  private announceLoadError(hasError: boolean): void {
    if (!hasError) {
      this.hasAnnouncedLoadError = false;
      return;
    }
    if (this.hasAnnouncedLoadError) return;
    this.hasAnnouncedLoadError = true;

    this.notifications
      .error(
        "Unable to load the latest drink data.",
        "Retry",
        NOTIFICATION_DEFAULT_DURATION,
      )
      .onAction()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.retryLoad());
  }

  /** Prompts the user to reload when a new app version is available. */
  private watchForAppUpdates(): void {
    if (!this.swUpdate?.isEnabled) return;

    this.swUpdate.versionUpdates
      .pipe(
        filter(
          (event): event is VersionReadyEvent => event.type === "VERSION_READY",
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        const ref = this.snackBar.open(
          "A new version is available.",
          "Reload",
          { duration: 10000 },
        );
        ref
          .onAction()
          .pipe(takeUntilDestroyed(this.destroyRef))
          .subscribe(() => {
            this.swUpdate
              ?.activateUpdate()
              .then(() => this.document.location.reload())
              .catch(() =>
                this.notifications.error(
                  "Failed to apply the update. Please reload the page.",
                ),
              );
          });
      });
  }

  @HostListener("window:keydown", ["$event"])
  onGlobalKeyDown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      this.openCommandPalette();
    }
  }

  openCommandPalette(): void {
    if (this.dialog.openDialogs.length > 0) return;
    // Loaded on demand so the palette stays out of the initial bundle.
    void import("./shared/components/command-palette/command-palette.component").then(
      (m) => {
        this.dialog.open(m.CommandPaletteComponent, {
          width: "580px",
          maxWidth: "92vw",
          panelClass: "command-palette-dialog-panel",
        });
      },
    );
  }

  retryLoad(): void {
    this.beerStore.load(true);
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

  prepareRoute(outlet: unknown) {
    const o = outlet as { activatedRouteData?: { [key: string]: string } };
    return o && o.activatedRouteData && o.activatedRouteData["animation"];
  }
}
