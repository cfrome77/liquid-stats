import {
  enableProdMode,
  isDevMode,
  ErrorHandler,
  provideBrowserGlobalErrorListeners,
} from "@angular/core";
import { bootstrapApplication } from "@angular/platform-browser";
import {
  provideRouter,
  withComponentInputBinding,
  TitleStrategy,
} from "@angular/router";
import { provideHttpClient } from "@angular/common/http";
import { IMAGE_LOADER } from "@angular/common";
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async";
import { provideServiceWorker } from "@angular/service-worker";

import { AppComponent } from "./app/app.component";
import { routes } from "./app/app-routing.module";
import { environment } from "./environments/environment";
import { imageLoader } from "./app/core/image-loader";
import { AppTitleStrategy } from "./app/core/app-title-strategy";
import { GlobalErrorHandler } from "./app/core/services/global-error-handler";

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes, withComponentInputBinding()),
    { provide: TitleStrategy, useClass: AppTitleStrategy },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    provideBrowserGlobalErrorListeners(),
    {
      provide: IMAGE_LOADER,
      useValue: imageLoader,
    },
    provideHttpClient(),
    provideAnimationsAsync(),
    provideServiceWorker("ngsw-worker.js", {
      enabled: !isDevMode() || String(environment.production) === "true",
      registrationStrategy: "registerWhenStable:30000",
    }),
  ],
}).catch((err) => console.error(err));
