// src/test.ts

import "zone.js/testing";
import { getTestBed, TestBed } from "@angular/core/testing";
import { IMAGE_LOADER } from "@angular/common";
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from "@angular/platform-browser-dynamic/testing";

import { imageLoader } from "./app/core/image-loader";

// Initialize the Angular testing environment
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);

// Provide the app's image loader to every spec so NgOptimizedImage does not
// warn about an unconfigured loader when components with ngSrcset render.
// Registered here so it runs before each spec's own beforeEach.
beforeEach(() => {
  TestBed.configureTestingModule({
    providers: [{ provide: IMAGE_LOADER, useValue: imageLoader }],
  });
});
