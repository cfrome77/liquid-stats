import { Route } from "@angular/router";
import { routes } from "./app-routing.module";

/**
 * Guards the lazy-loading contract for every feature route. A route that swaps
 * `loadComponent` for an eager `component` reference silently pulls the whole
 * feature into the initial bundle, which is exactly what this performance work
 * is meant to prevent. Asserting on the route table keeps that regression
 * visible without booting the router.
 */
describe("app routes", () => {
  const featureRoutes = routes.filter(
    (route) => route.path !== "" && route.path !== "**",
  );

  it("declares a lazy loadComponent for every feature route", () => {
    expect(featureRoutes.length).toBeGreaterThan(0);

    for (const route of featureRoutes) {
      const label = `route "${route.path}"`;
      expect(route.loadComponent)
        .withContext(`${label} is not lazy`)
        .toBeDefined();
      expect(route.component).withContext(`${label} is eager`).toBeUndefined();
      expect(route.loadChildren)
        .withContext(`${label} loads children`)
        .toBeUndefined();
      expect(route.children)
        .withContext(`${label} has children`)
        .toBeUndefined();
    }
  });

  it("loads the 404 route lazily as well", () => {
    const notFound = routes.find((route) => route.path === "**") as Route;
    expect(notFound).toBeDefined();
    expect(notFound.loadComponent).toBeDefined();
    expect(notFound.component).toBeUndefined();
  });

  it("redirects the empty path to home", () => {
    const root = routes.find((route) => route.path === "") as Route;
    expect(root).toBeDefined();
    expect(root.redirectTo).toBe("/home");
    expect(root.pathMatch).toBe("full");
  });

  it("covers each expected feature path exactly once", () => {
    const paths = featureRoutes.map((route) => route.path).sort();
    expect(paths).toEqual([
      "about",
      "badges",
      "beer-history",
      "checkins",
      "checkins/:id",
      "home",
      "insights",
      "map",
      "stats",
      "top-beers",
      "wishlist",
    ]);
  });

  it("resolves each lazy loader to a component class", async () => {
    for (const route of featureRoutes) {
      const loaded = await route.loadComponent!();
      expect(typeof loaded)
        .withContext(`route "${route.path}" did not resolve to a component`)
        .toBe("function");
    }
  });
});
