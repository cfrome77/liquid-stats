import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { HttpClientModule } from "@angular/common/http";
import { MarkerService } from './_services/marker.service';
import { PopUpService } from './_services/pop-up.service';
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatIconModule } from "@angular/material/icon";
import { MatChipsModule } from "@angular/material/chips";
import { MatDialogModule } from "@angular/material/dialog";
import { MatSidenavModule } from "@angular/material/sidenav";
import { FlexLayoutModule } from "@angular/flex-layout";
import { MatDividerModule } from '@angular/material/divider';

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { CheckinsComponent } from "./checkins/checkins.component";
import { TopbeersComponent } from "./topbeers/topbeers.component";
import { BadgesComponent } from "./badges/badges.component";
import { WishlistComponent } from "./wishlist/wishlist.component";
import { StatsComponent } from "./stats/stats.component";
import { AboutComponent } from "./about/about.component";
import { HomeComponent } from "./home/home.component";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

@NgModule({
  declarations: [
    AppComponent,
    CheckinsComponent,
    TopbeersComponent,
    BadgesComponent,
    WishlistComponent,
    StatsComponent,
    AboutComponent,
    HomeComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatButtonModule,
    MatMenuModule,
    MatToolbarModule,
    MatIconModule,
    MatCardModule,
    MatChipsModule,
    MatDialogModule,
    MatSidenavModule,
    FlexLayoutModule,
    MatDividerModule,
  ],
  exports: [],
  providers: [MarkerService, PopUpService],
  bootstrap: [AppComponent],
  entryComponents: [AboutComponent],
})
export class AppModule { }
