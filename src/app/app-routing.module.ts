import { Routes } from "@angular/router";

export const routes: Routes = [
  { path: "", redirectTo: "/home", pathMatch: "full" },
  {
    path: "home",
    loadComponent: () =>
      import("./components/home/home.component").then((m) => m.HomeComponent),
    data: { animation: "HomePage" },
  },
  {
    path: "checkins",
    loadComponent: () =>
      import("./components/checkins/checkins.component").then(
        (m) => m.CheckinsComponent,
      ),
    data: { animation: "CheckinsPage" },
  },
  {
    path: "checkins/:id",
    loadComponent: () =>
      import("./components/checkins/checkins.component").then(
        (m) => m.CheckinsComponent,
      ),
    data: { animation: "CheckinsPage" },
  },
  {
    path: "top-beers",
    loadComponent: () =>
      import("./components/top-beers/top-beers.component").then(
        (m) => m.TopBeersComponent,
      ),
    data: { animation: "TopBeersPage" },
  },
  {
    path: "badges",
    loadComponent: () =>
      import("./components/badges/badges.component").then(
        (m) => m.BadgesComponent,
      ),
    data: { animation: "BadgesPage" },
  },
  {
    path: "map",
    loadComponent: () =>
      import("./components/map/map.component").then((m) => m.MapComponent),
    data: { mapId: "myMap", animation: "MapPage" },
  },
  {
    path: "beer-history",
    loadComponent: () =>
      import("./components/beer-history/beer-history.component").then(
        (m) => m.BeerHistoryComponent,
      ),
    data: { animation: "HistoryPage" },
  },
  {
    path: "stats",
    loadComponent: () =>
      import("./components/stats/stats.component").then(
        (m) => m.StatsComponent,
      ),
    data: { animation: "StatsPage" },
  },
  {
    path: "wishlist",
    loadComponent: () =>
      import("./components/wishlist/wishlist.component").then(
        (m) => m.WishlistComponent,
      ),
    data: { animation: "WishlistPage" },
  },
  {
    path: "about",
    loadComponent: () =>
      import("./components/about/about.component").then(
        (m) => m.AboutComponent,
      ),
    data: { animation: "AboutPage" },
  },
];
