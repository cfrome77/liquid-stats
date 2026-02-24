import { NgModule } from "@angular/core";
import { Routes, RouterModule } from "@angular/router";

import { HomeComponent } from "./components/home/home.component";
import { CheckinsComponent } from "./components/checkins/checkins.component";
import { TopBeersComponent } from "./components/top-beers/top-beers.component";
import { BadgesComponent } from "./components/badges/badges.component";
import { MapComponent } from "./components/map/map.component";
import { BeerHistoryComponent } from "./components/beer-history/beer-history.component";
import { StatsComponent } from "./components/stats/stats.component";
import { WishlistComponent } from "./components/wishlist/wishlist.component";
import { AboutComponent } from "./components/about/about.component";

export const routes: Routes = [
  { path: "", redirectTo: "/home", pathMatch: "full" },
  { path: "home", component: HomeComponent, data: { animation: "HomePage" } },
  { path: "checkins", component: CheckinsComponent, data: { animation: "CheckinsPage" } },
  { path: "top-beers", component: TopBeersComponent, data: { animation: "TopBeersPage" } },
  { path: "badges", component: BadgesComponent, data: { animation: "BadgesPage" } },
  { path: "map", component: MapComponent, data: { mapId: "myMap", animation: "MapPage" } },
  { path: "beer-history", component: BeerHistoryComponent, data: { animation: "HistoryPage" } },
  { path: "stats", component: StatsComponent, data: { animation: "StatsPage" } },
  { path: "wishlist", component: WishlistComponent, data: { animation: "WishlistPage" } },
  { path: "about", component: AboutComponent, data: { animation: "AboutPage" } },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
