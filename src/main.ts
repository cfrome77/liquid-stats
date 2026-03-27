import { enableProdMode, importProvidersFrom, isDevMode } from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import { provideRouter, withComponentInputBinding } from "@angular/router";
import { provideHttpClient } from "@angular/common/http";
import { provideAnimations } from "@angular/platform-browser/animations";
import { MatNativeDateModule } from "@angular/material/core";
import { provideCharts, withDefaultRegisterables } from "ng2-charts";
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
    provideHttpClient(),
    provideAnimations(),
    provideCharts(withDefaultRegisterables()),
    importProvidersFrom(MatNativeDateModule),
    provideServiceWorker("ngsw-worker.js", {
      enabled: !isDevMode() || String(environment.production) === "true",
      registrationStrategy: "registerWhenStable:30000",
    }),
  ],
}).catch((err) => console.error(err));
