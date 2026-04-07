import { Injectable, NgZone, inject } from "@angular/core";
import { environment } from "src/environments/environment";

// 🚨 Declare gtag globally so TypeScript knows it exists
declare const gtag: (...args: unknown[]) => void;

@Injectable({
  providedIn: "root",
})
export class Ga4TrackingService {
  private ngZone = inject(NgZone);

  private readonly MEASUREMENT_ID = environment.GA4_MEASUREMENT_ID;
  private isScriptLoaded = false;

  /**
   * 1. Dynamically loads the gtag script and initializes GA4.
   */
  public loadAndInitialize(): void {
    this.ngZone.runOutsideAngular(() => {
      if (this.isScriptLoaded || !this.MEASUREMENT_ID) {
        // eslint-disable-next-line no-console
        console.warn("GA4 script already loaded or Measurement ID missing.");
        return;
      }

      // A. Inject the script tag into the <head>
      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.MEASUREMENT_ID}`;
      document.head.appendChild(script);

      // B. Initialize the dataLayer and the gtag function
      // This replicates the standard inline script block
      (window as unknown as { dataLayer: unknown[] }).dataLayer =
        (window as unknown as { dataLayer: unknown[] }).dataLayer || [];
      (window as unknown as { gtag: (...args: unknown[]) => void }).gtag =
        function (...args: unknown[]) {
          (window as unknown as { dataLayer: unknown[][] }).dataLayer.push(
            args,
          );
        };
      (window as unknown as { gtag: (...args: unknown[]) => void }).gtag(
        "js",
        new Date(),
      );

      // C. Fire the initial configuration command
      (window as unknown as { gtag: (...args: unknown[]) => void }).gtag(
        "config",
        this.MEASUREMENT_ID,
        {
          // Disabling auto-page-view here prevents the script from firing a
          // page_view *immediately* upon loading. We'll fire it manually next.
          send_page_view: false,
        },
      );

      this.isScriptLoaded = true;
      // eslint-disable-next-line no-console
      console.log(
        `✅ GA4 script loaded and initialized with ID: ${this.MEASUREMENT_ID}`,
      );
    });
  }

  /**
   * 2. Sends a manual page_view event to GA4 for all navigations.
   */
  public trackPageView(path: string, title: string): void {
    this.ngZone.runOutsideAngular(() => {
      if (typeof gtag !== "undefined" && this.MEASUREMENT_ID) {
        // 1. Send the config to update the context (page_path/title)
        gtag("config", this.MEASUREMENT_ID, {
          page_path: path,
          page_title: title,
        });

        // 2. Explicitly send the 'page_view' event
        gtag("event", "page_view", {
          page_location: window.location.origin + path,
          page_title: title,
        });

        // eslint-disable-next-line no-console
        console.log(`GA4 Page View Tracked: ${path}`);
      } else {
        // eslint-disable-next-line no-console
        console.warn("GA4 gtag not ready. Page view not tracked.");
      }
    });
  }
}
