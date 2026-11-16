import { TestBed } from "@angular/core/testing";
import { Component } from "@angular/core";
import { Meta, Title } from "@angular/platform-browser";
import { Router, TitleStrategy, provideRouter } from "@angular/router";

import { AppTitleStrategy } from "./app-title-strategy";

@Component({ standalone: true, template: "" })
class BlankComponent {}

describe("AppTitleStrategy", () => {
  let router: Router;
  let title: Title;
  let meta: Meta;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([
          {
            path: "stats",
            component: BlankComponent,
            title: "Stats",
            data: { description: "Your drinking statistics." },
          },
          { path: "untitled", component: BlankComponent },
        ]),
        { provide: TitleStrategy, useClass: AppTitleStrategy },
      ],
    });
    router = TestBed.inject(Router);
    title = TestBed.inject(Title);
    meta = TestBed.inject(Meta);
  });

  it("suffixes the route title with the app name", async () => {
    await router.navigateByUrl("/stats");
    expect(title.getTitle()).toBe("Stats · Liquid Stats");
  });

  it("falls back to the bare app name when a route has no title", async () => {
    await router.navigateByUrl("/untitled");
    expect(title.getTitle()).toBe("Liquid Stats");
  });

  it("uses the route description for the meta and social tags", async () => {
    await router.navigateByUrl("/stats");
    expect(meta.getTag('name="description"')?.content).toBe(
      "Your drinking statistics.",
    );
    expect(meta.getTag('property="og:description"')?.content).toBe(
      "Your drinking statistics.",
    );
    expect(meta.getTag('name="twitter:description"')?.content).toBe(
      "Your drinking statistics.",
    );
    expect(meta.getTag('property="og:title"')?.content).toBe(
      "Stats · Liquid Stats",
    );
    expect(meta.getTag('name="twitter:title"')?.content).toBe(
      "Stats · Liquid Stats",
    );
  });

  it("falls back to a default description when the route has none", async () => {
    await router.navigateByUrl("/untitled");
    expect(meta.getTag('name="description"')?.content).toContain(
      "Track every pour",
    );
  });
});
