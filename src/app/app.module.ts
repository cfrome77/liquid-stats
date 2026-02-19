import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { CommonModule } from "@angular/common";
import { HttpClientModule } from "@angular/common/http";
import { MarkerService } from "./core/services/marker.service";
import { PopUpService } from "./core/services/pop-up.service";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatIconModule } from "@angular/material/icon";
import { MatChipsModule } from "@angular/material/chips";
import { MatDialogModule } from "@angular/material/dialog";
import { MatRadioModule } from "@angular/material/radio";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatSelectModule } from "@angular/material/select";
import { MatOptionModule } from "@angular/material/core";
import { MatDividerModule } from "@angular/material/divider";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatNativeDateModule } from "@angular/material/core";
import { FormsModule } from "@angular/forms";
import { ReactiveFormsModule } from "@angular/forms";
import {
  BaseChartDirective,
  provideCharts,
  withDefaultRegisterables,
} from "ng2-charts";

import { AppRoutingModule } from "./app-routing.module";
import { AppComponent } from "./app.component";
import { CheckinsComponent } from "./components/checkins/checkins.component";
import { TopBeersComponent } from "./components/top-beers/top-beers.component";
import { BadgesComponent } from "./components/badges/badges.component";
import { WishlistComponent } from "./components/wishlist/wishlist.component";
import { MapComponent } from "./components/map/map.component";
import { BeerHistoryComponent } from "./components/beer-history/beer-history.component";
import { StatsComponent } from "./components/stats/stats.component";
import { AboutComponent } from "./components/about/about.component";
import { HomeComponent } from "./components/home/home.component";
import { PaginationComponent } from "./shared/components/pagination/pagination.component";
import { FilterComponent } from "./shared/components/filter/filter.component";
import { ScrollToTopComponent } from "./shared/components/scroll-to-top/scroll-to-top.component";
import { MatTooltipModule } from "@angular/material/tooltip";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { RatingComponent } from "./shared/components/rating/rating.component";
import { PoweredByComponent } from "./shared/components/powered-by/powered-by.component";
import { BadgeDialogComponent } from "./shared/components/badge-dialog/badge-dialog.component";
import { SocialLinksComponent } from "./shared/components/social-links/social-links.component";
import { BeerStyleDialogComponent } from "./shared/components/beer-style-dialog/beer-style-dialog.component";
import { CardComponent } from "./shared/components/card/card.component";

@NgModule({
  declarations: [
    AppComponent,
    CheckinsComponent,
    TopBeersComponent,
    BadgesComponent,
    WishlistComponent,
    MapComponent,
    BeerHistoryComponent,
    StatsComponent,
    AboutComponent,
    HomeComponent,
    PaginationComponent,
    FilterComponent,
    ScrollToTopComponent,
    RatingComponent,
    PoweredByComponent,
    BadgeDialogComponent,
    SocialLinksComponent,
    BeerStyleDialogComponent,
    CardComponent,
  ],
  imports: [
    BrowserModule,
    CommonModule,
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
    MatRadioModule,
    MatSidenavModule,
    MatSelectModule,
    MatOptionModule,
    MatDividerModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatTooltipModule,
    ReactiveFormsModule,
    BaseChartDirective,
  ],
  exports: [],
  providers: [
    MarkerService,
    PopUpService,
    provideCharts(withDefaultRegisterables()),
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
