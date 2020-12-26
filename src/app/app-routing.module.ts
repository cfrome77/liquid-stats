  
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './home/home.component';
import { CheckinsComponent } from './checkins/checkins.component';
import { TopbeersComponent } from './topbeers/topbeers.component';
import { StatsComponent } from './stats/stats.component';
import { WishlistComponent } from './wishlist/wishlist.component';
import { AboutComponent } from './about/about.component';

export const routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, label: 'Home' },
  { path: 'checkins', component: CheckinsComponent, label: 'Checkins' },
  { path: 'topbeers', component: TopbeersComponent, label: 'Top Beers' },
  { path: 'stats', component: StatsComponent, label: 'Stats' },
  { path: 'wishlist', component: WishlistComponent, label: 'Wishlist' },
  { path: 'about', component: AboutComponent, label: 'About' }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }