  
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { CheckinsComponent } from './checkins/checkins.component';
import { TopbeersComponent } from './topbeers/topbeers.component';
import { BadgesComponent } from './badges/badges.component';
import { StatsComponent } from './stats/stats.component';
import { WishlistComponent } from './wishlist/wishlist.component';
import { AboutComponent } from './about/about.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'checkins', component: CheckinsComponent },
  { path: 'topbeers', component: TopbeersComponent },
  { path: 'badges', component: BadgesComponent },
  { path: 'stats', component: StatsComponent },
  { path: 'wishlist', component: WishlistComponent },
  { path: 'about', component: AboutComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }