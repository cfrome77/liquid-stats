import {
  Component,
  OnInit,
  inject,
  signal,
  ChangeDetectionStrategy,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import {
  MatDialogRef,
  MatDialogModule,
  MatDialog,
} from "@angular/material/dialog";
import { MatIconModule } from "@angular/material/icon";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { Router } from "@angular/router";

import { BeerStoreService } from "src/app/core/services/beer-store.service";
import { BeerCheckin } from "src/app/core/models/beer.model";
import {
  BeerStyleDialogComponent,
  GenericBeersDialogData,
} from "../beer-style-dialog/beer-style-dialog.component";
import { sanitizeUntappdUrl } from "src/app/core/utils/url-utils";
import { environment } from "src/environments/environment";

export interface SearchResultItem {
  type: "page" | "drink" | "brewery" | "style";
  title: string;
  subtitle: string;
  icon: string;
  route?: string;
  data?: unknown;
}

@Component({
  selector: "app-command-palette",
  templateUrl: "./command-palette.component.html",
  styleUrls: ["./command-palette.component.css"],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CommandPaletteComponent implements OnInit {
  private dialogRef = inject(MatDialogRef<CommandPaletteComponent>);
  private dialog = inject(MatDialog);
  private router = inject(Router);
  private beerStore = inject(BeerStoreService);

  public searchTerm = signal<string>("");
  public allBeers: BeerCheckin[] = [];
  public results = signal<SearchResultItem[]>([]);

  public pages: SearchResultItem[] = [
    {
      type: "page",
      title: "Home",
      subtitle: "Overview and recent check-ins",
      icon: "home",
      route: "/",
    },
    {
      type: "page",
      title: "Checkins",
      subtitle: "All recent check-in logs",
      icon: "room",
      route: "/checkins",
    },
    {
      type: "page",
      title: "Top Drinks",
      subtitle: "Highest rated drinks",
      icon: "emoji_events",
      route: "/top-beers",
    },
    {
      type: "page",
      title: "Badges",
      subtitle: "Earned Untappd badges",
      icon: "badge",
      route: "/badges",
    },
    {
      type: "page",
      title: "Map",
      subtitle: "Interactive brewery locations map",
      icon: "map",
      route: "/map",
    },
    {
      type: "page",
      title: "Drink History",
      subtitle: "Complete beer catalog",
      icon: "history",
      route: "/beer-history",
    },
    {
      type: "page",
      title: "Stats",
      subtitle: "Charts and check-in breakdowns",
      icon: "insert_chart",
      route: "/stats",
    },
    {
      type: "page",
      title: "Insights",
      subtitle: "Flavor profile & milestones",
      icon: "insights",
      route: "/insights",
    },
    {
      type: "page",
      title: "Wishlist",
      subtitle: "Saved drinks to try",
      icon: "list",
      route: "/wishlist",
    },
  ];

  ngOnInit(): void {
    this.beerStore.load();
    this.beerStore.beers$.subscribe((beers) => {
      this.allBeers = beers || [];
      this.updateResults();
    });
  }

  onSearchChange(term: string): void {
    this.searchTerm.set(term);
    this.updateResults();
  }

  private updateResults(): void {
    const query = this.searchTerm().trim().toLowerCase();
    if (!query) {
      this.results.set(this.pages);
      return;
    }

    const items: SearchResultItem[] = [];

    // Filter pages
    const matchedPages = this.pages.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.subtitle.toLowerCase().includes(query),
    );
    items.push(...matchedPages);

    if (this.allBeers.length > 0) {
      // Search drinks (max 10)
      const matchedBeers = this.allBeers
        .filter((b) => b.beer.beer_name.toLowerCase().includes(query))
        .slice(0, 10);

      matchedBeers.forEach((b) => {
        items.push({
          type: "drink",
          title: b.beer.beer_name,
          subtitle: `${b.brewery.brewery_name} • ${b.beer.beer_style}`,
          icon: "local_drink",
          data: b,
        });
      });

      // Search unique breweries (max 5)
      const breweryMap = new Map<string, BeerCheckin[]>();
      this.allBeers.forEach((b) => {
        const name = b.brewery.brewery_name;
        if (!breweryMap.has(name)) breweryMap.set(name, []);
        breweryMap.get(name)!.push(b);
      });

      let breweryMatches = 0;
      for (const [breweryName, beers] of breweryMap.entries()) {
        if (breweryMatches >= 5) break;
        if (breweryName.toLowerCase().includes(query)) {
          items.push({
            type: "brewery",
            title: breweryName,
            subtitle: `${beers[0].brewery.country_name || "Brewery"} • ${beers.length} drink(s)`,
            icon: "business",
            data: { breweryName, beers },
          });
          breweryMatches++;
        }
      }

      // Search unique styles (max 5)
      const styleMap = new Map<string, BeerCheckin[]>();
      this.allBeers.forEach((b) => {
        const style = b.beer.beer_style || "Unknown";
        if (!styleMap.has(style)) styleMap.set(style, []);
        styleMap.get(style)!.push(b);
      });

      let styleMatches = 0;
      for (const [styleName, beers] of styleMap.entries()) {
        if (styleMatches >= 5) break;
        if (styleName.toLowerCase().includes(query)) {
          items.push({
            type: "style",
            title: styleName,
            subtitle: `${beers.length} drink(s)`,
            icon: "category",
            data: { styleName, beers },
          });
          styleMatches++;
        }
      }
    }

    this.results.set(items);
  }

  selectItem(item: SearchResultItem): void {
    this.dialogRef.close();

    if (item.type === "page" && item.route) {
      this.router.navigate([item.route]);
    } else if (item.type === "drink" && item.data) {
      const b = item.data as BeerCheckin;
      this.openBeersDialog(b.beer.beer_name, [b]);
    } else if (item.type === "brewery" && item.data) {
      const d = item.data as { breweryName: string; beers: BeerCheckin[] };
      this.openBeersDialog(`${d.breweryName} Drinks`, d.beers);
    } else if (item.type === "style" && item.data) {
      const d = item.data as { styleName: string; beers: BeerCheckin[] };
      this.openBeersDialog(`${d.styleName} Drinks`, d.beers);
    }
  }

  private openBeersDialog(title: string, beers: BeerCheckin[]): void {
    const data: GenericBeersDialogData = {
      title,
      beers: beers.map((b) => ({
        beerName: b.beer.beer_name,
        beerLabel: sanitizeUntappdUrl(b.beer.beer_label) || b.beer.beer_label,
        breweryName: b.brewery.brewery_name,
        beerABV: b.beer.beer_abv,
        rating: b.rating_score,
        checkInDate: b.first_created_at || b.recent_created_at,
        checkinUrl:
          environment.UNTAPPD_USERNAME && b.recent_checkin_id
            ? `https://untappd.com/user/${environment.UNTAPPD_USERNAME}/checkin/${b.recent_checkin_id}`
            : undefined,
      })),
    };

    this.dialog.open(BeerStyleDialogComponent, {
      data,
      width: "350px",
      maxHeight: "80vh",
    });
  }
}
