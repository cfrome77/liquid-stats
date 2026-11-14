import { TestBed } from "@angular/core/testing";
import { Component } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { Router, TitleStrategy, provideRouter } from "@angular/router";

import { AppTitleStrategy } from "./app-title-strategy";

@Component({ standalone: true, template: "" })
class BlankComponent {}

describe("AppTitleStrategy", () => {
  let router: Router;
  let title: Title;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          { path: "stats", component: BlankComponent, title: "Stats" },
          { path: "untitled", component: BlankComponent },
        ]),
        { provide: TitleStrategy, useClass: AppTitleStrategy },
      ],
    });
    router = TestBed.inject(Router);
    title = TestBed.inject(Title);
  });

  it("suffixes the route title with the app name", async () => {
    await router.navigateByUrl("/stats");
    expect(title.getTitle()).toBe("Stats · Liquid Stats");
  });

  it("falls back to the bare app name when a route has no title", async () => {
    await router.navigateByUrl("/untitled");
    expect(title.getTitle()).toBe("Liquid Stats");
  });
});
