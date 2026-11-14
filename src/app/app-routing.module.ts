import { Routes } from "@angular/router";

export const routes: Routes = [
  { path: "", redirectTo: "/home", pathMatch: "full" },
  {
    path: "home",
    loadComponent: () =>
      import("./components/home/home.component").then((m) => m.HomeComponent),
    title: "Home",
    data: {
      animation: "HomePage",
      description:
        "Track every pour you enjoy. Explore your beer history, checkins, top-rated drinks, badges, and statistics.",
    },
  },
  {
    path: "checkins",
    loadComponent: () =>
      import("./components/checkins/checkins.component").then(
        (m) => m.CheckinsComponent,
      ),
    title: "Checkins",
    data: {
      animation: "CheckinsPage",
      description:
        "Browse every checkin, with ratings, comments, and the drinks behind them.",
    },
  },
  {
    path: "checkins/:id",
    loadComponent: () =>
      import("./components/checkins/checkins.component").then(
        (m) => m.CheckinsComponent,
      ),
    title: "Checkin Details",
    data: {
      animation: "CheckinsPage",
      description:
        "Details for a single checkin, including the drink, brewery, rating, and comment.",
    },
  },
  {
    path: "top-beers",
    loadComponent: () =>
      import("./components/top-beers/top-beers.component").then(
        (m) => m.TopBeersComponent,
      ),
    title: "Top Drinks",
    data: {
      animation: "TopBeersPage",
      description:
        "Your highest-rated drinks, ranked, with brewery and style breakdowns.",
    },
  },
  {
    path: "badges",
    loadComponent: () =>
      import("./components/badges/badges.component").then(
        (m) => m.BadgesComponent,
      ),
    title: "Badges",
    data: {
      animation: "BadgesPage",
      description:
        "The badges you have earned on Untappd, collected in one place.",
    },
  },
  {
    path: "map",
    loadComponent: () =>
      import("./components/map/map.component").then((m) => m.MapComponent),
    title: "Map",
    data: {
      mapId: "myMap",
      animation: "MapPage",
      description:
        "Every place you have checked in, plotted on an interactive map.",
    },
  },
  {
    path: "beer-history",
    loadComponent: () =>
      import("./components/beer-history/beer-history.component").then(
        (m) => m.BeerHistoryComponent,
      ),
    title: "Beer History",
    data: {
      animation: "HistoryPage",
      description:
        "Search and filter your full drinking history by drink, brewery, style, and rating.",
    },
  },
  {
    path: "stats",
    loadComponent: () =>
      import("./components/stats/stats.component").then(
        (m) => m.StatsComponent,
      ),
    title: "Stats",
    data: {
      animation: "StatsPage",
      description:
        "Your drinking statistics: totals, averages, styles, and trends over time.",
    },
  },
  {
    path: "insights",
    loadComponent: () =>
      import("./components/insights/insights.component").then(
        (m) => m.InsightsComponent,
      ),
    title: "Insights",
    data: {
      animation: "InsightsPage",
      description:
        "Insights into your drinking habits, from favourite styles to busiest months.",
    },
  },
  {
    path: "wishlist",
    loadComponent: () =>
      import("./components/wishlist/wishlist.component").then(
        (m) => m.WishlistComponent,
      ),
    title: "Wishlist",
    data: {
      animation: "WishlistPage",
      description: "The drinks you want to try next, saved to your wishlist.",
    },
  },
  {
    path: "about",
    loadComponent: () =>
      import("./components/about/about.component").then(
        (m) => m.AboutComponent,
      ),
    title: "About",
    data: {
      animation: "AboutPage",
      description:
        "About Liquid Stats, and how your Untappd data becomes these statistics.",
    },
  },
  {
    path: "**",
    loadComponent: () =>
      import("./components/not-found/not-found.component").then(
        (m) => m.NotFoundComponent,
      ),
    title: "Page Not Found",
    data: {
      animation: "NotFoundPage",
      description: "The page you were looking for could not be found.",
    },
  },
];
