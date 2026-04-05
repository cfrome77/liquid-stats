import { Injectable, NgZone, inject } from "@angular/core";
import { environment } from "src/environments/environment";
import { LoggingService } from "./logger.service";

// 1. Define a specific signature for gtag to avoid 'Function' and 'any' errors
type GtagFn = (
  command: string,
  action: string,
  params?: Record<string, string | number | boolean | undefined | object>,
) => void;

interface GtagWindow extends Window {
  dataLayer: unknown[];
  gtag: GtagFn;
}

@Injectable({
  providedIn: "root",
})
export class Ga4TrackingService {
  private ngZone = inject(NgZone);
  private logger = inject(LoggingService);

  private readonly MEASUREMENT_ID = environment.GA4_MEASUREMENT_ID;
  private isScriptLoaded = false;

  public loadAndInitialize(): void {
    this.ngZone.runOutsideAngular(() => {
      if (this.isScriptLoaded || !this.MEASUREMENT_ID) {
        console.warn("GA4 script already loaded or Measurement ID missing.");
        return;
      }

      const script = document.createElement("script");
      script.async = true;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.MEASUREMENT_ID}`;
      document.head.appendChild(script);

      // 2. Use the typed GtagWindow interface to avoid 'any'
      const win = window as unknown as GtagWindow;
      win.dataLayer = win.dataLayer || [];

      // 3. Use rest parameters (...args) instead of 'arguments'
      win.gtag = function (...args: unknown[]) {
        win.dataLayer.push(args);
      } as unknown as GtagFn;

      win.gtag("js", new Date().toISOString());

      win.gtag("config", this.MEASUREMENT_ID, {
        send_page_view: false,
      });

      this.isScriptLoaded = true;
      // 4. Use LoggingService instead of console.log
      // Prettier fix: Move long string to new line
      this.logger.info(
        `✅ GA4 script loaded and initialized with ID: ${this.MEASUREMENT_ID}`,
      );
    });
  }

  public trackPageView(path: string, title: string): void {
    this.ngZone.runOutsideAngular(() => {
      const win = window as unknown as GtagWindow;
      if (typeof win.gtag !== "undefined" && this.MEASUREMENT_ID) {
        win.gtag("config", this.MEASUREMENT_ID, {
          page_path: path,
          page_title: title,
        });

        win.gtag("event", "page_view", {
          page_location: window.location.origin + path,
          page_title: title,
        });

        this.logger.info(`GA4 Page View Tracked: ${path}`);
      } else {
        console.warn("GA4 gtag not ready. Page view not tracked.");
      }
    });
  }
}
