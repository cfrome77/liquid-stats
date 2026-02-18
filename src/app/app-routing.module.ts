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
  { path: "home", component: HomeComponent },
  { path: "checkins", component: CheckinsComponent },
  { path: "top-beers", component: TopBeersComponent },
  { path: "badges", component: BadgesComponent },
  { path: "map", component: MapComponent, data: { mapId: "myMap" } },
  { path: "beer-history", component: BeerHistoryComponent },
  { path: "stats", component: StatsComponent },
  { path: "wishlist", component: WishlistComponent },
  { path: "about", component: AboutComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
