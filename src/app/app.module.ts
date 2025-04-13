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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms'; 

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { CheckinsComponent } from "./checkins/checkins.component";
import { TopbeersComponent } from "./topbeers/topbeers.component";
import { BadgesComponent } from "./badges/badges.component";
import { WishlistComponent } from "./wishlist/wishlist.component";
import { MapComponent } from "./map/map.component";
import { StatsComponent } from './stats/stats.component';
import { AboutComponent } from "./about/about.component";
import { HomeComponent } from "./home/home.component";
import { PaginationComponent } from './_services/pagination/pagination.component';
import { FilterComponent } from './_services/filter/filter.component';
import { ScrollToTopComponent } from './_services/scroll-to-top/scroll-to-top.component';
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";

@NgModule({
  declarations: [
    AppComponent,
    CheckinsComponent,
    TopbeersComponent,
    BadgesComponent,
    WishlistComponent,
    MapComponent,
    StatsComponent,
    AboutComponent,
    HomeComponent,
    PaginationComponent,
    FilterComponent,
    ScrollToTopComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
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
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  exports: [],
  providers: [MarkerService, PopUpService],
  bootstrap: [AppComponent],
  entryComponents: [AboutComponent],
})
export class AppModule { }
