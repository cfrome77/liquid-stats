import { Routes } from "@angular/router";

export const routes: Routes = [
  { path: "", redirectTo: "/home", pathMatch: "full" },
  {
    path: "home",
    loadComponent: () =>
      import("./components/home/home.component").then((m) => m.HomeComponent),
    title: "Home",
    data: { animation: "HomePage" },
  },
  {
    path: "checkins",
    loadComponent: () =>
      import("./components/checkins/checkins.component").then(
        (m) => m.CheckinsComponent,
      ),
    title: "Checkins",
    data: { animation: "CheckinsPage" },
  },
  {
    path: "checkins/:id",
    loadComponent: () =>
      import("./components/checkins/checkins.component").then(
        (m) => m.CheckinsComponent,
      ),
    title: "Checkin Details",
    data: { animation: "CheckinsPage" },
  },
  {
    path: "top-beers",
    loadComponent: () =>
      import("./components/top-beers/top-beers.component").then(
        (m) => m.TopBeersComponent,
      ),
    title: "Top Drinks",
    data: { animation: "TopBeersPage" },
  },
  {
    path: "badges",
    loadComponent: () =>
      import("./components/badges/badges.component").then(
        (m) => m.BadgesComponent,
      ),
    title: "Badges",
    data: { animation: "BadgesPage" },
  },
  {
    path: "map",
    loadComponent: () =>
      import("./components/map/map.component").then((m) => m.MapComponent),
    title: "Map",
    data: { mapId: "myMap", animation: "MapPage" },
  },
  {
    path: "beer-history",
    loadComponent: () =>
      import("./components/beer-history/beer-history.component").then(
        (m) => m.BeerHistoryComponent,
      ),
    title: "Beer History",
    data: { animation: "HistoryPage" },
  },
  {
    path: "stats",
    loadComponent: () =>
      import("./components/stats/stats.component").then(
        (m) => m.StatsComponent,
      ),
    title: "Stats",
    data: { animation: "StatsPage" },
  },
  {
    path: "insights",
    loadComponent: () =>
      import("./components/insights/insights.component").then(
        (m) => m.InsightsComponent,
      ),
    title: "Insights",
    data: { animation: "InsightsPage" },
  },
  {
    path: "wishlist",
    loadComponent: () =>
      import("./components/wishlist/wishlist.component").then(
        (m) => m.WishlistComponent,
      ),
    title: "Wishlist",
    data: { animation: "WishlistPage" },
  },
  {
    path: "about",
    loadComponent: () =>
      import("./components/about/about.component").then(
        (m) => m.AboutComponent,
      ),
    title: "About",
    data: { animation: "AboutPage" },
  },
  {
    path: "**",
    loadComponent: () =>
      import("./components/not-found/not-found.component").then(
        (m) => m.NotFoundComponent,
      ),
    title: "Page Not Found",
    data: { animation: "NotFoundPage" },
  },
];
