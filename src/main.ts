import { enableProdMode, importProvidersFrom, isDevMode } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideRouter, withComponentInputBinding } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";
import { IMAGE_LOADER, ImageLoaderConfig } from "@angular/common";
import { provideAnimations } from "@angular/platform-browser/animations";
import { provideServiceWorker } from "@angular/service-worker";

import { AppComponent } from "./app/app.component";
import { routes } from "./app/app-routing.module";
import { environment } from "./environments/environment";

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    {
      provide: IMAGE_LOADER,
      useValue: (config: ImageLoaderConfig) => {
        const url = config.src;
        const width = config.width;

        // 1. Local Hero Logo
        if (url.includes("LiquidStatsLogo.webp")) {
          if (width && width <= 400) {
            return url.replace("LiquidStatsLogo.webp", "LiquidStatsLogo-400w.webp");
          }
          return url;
        }

        // 2. Untappd Images
        // Example: https://assets.untappd.com/.../photo_img_md.jpg
        // Suffixes: _sm, _md, _lg
        if (url.includes("untappd.com") || url.includes("untp.beer")) {
          if (!width) return url;
          const suffix = width <= 100 ? "sm" : width <= 300 ? "md" : "lg";
          return url.replace(/_(sm|md|lg)\./, `_${suffix}.`);
        }

        return url;
      },
    },
    provideHttpClient(),
    provideAnimations(),
    provideServiceWorker("ngsw-worker.js", {
      enabled: !isDevMode() || String(environment.production) === "true",
      registrationStrategy: "registerWhenStable:30000",
    }),
  ],
}).catch((err) => console.error(err));
