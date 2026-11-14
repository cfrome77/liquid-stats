import { Injectable, inject } from "@angular/core";
import { Meta, Title } from "@angular/platform-browser";
import {
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  TitleStrategy,
} from "@angular/router";

const APP_NAME = "Liquid Stats";

const DEFAULT_DESCRIPTION =
  "Track every pour you enjoy. Explore your beer history, checkins, top-rated drinks, badges, and statistics.";

/**
 * Sets a per-route document title, suffixed with the app name, so browser
 * tabs and history entries are distinguishable. Also mirrors the route title
 * and description into the meta description and Open Graph / Twitter tags so
 * link previews reflect the page actually being shared.
 */
@Injectable({ providedIn: "root" })
export class AppTitleStrategy extends TitleStrategy {
  private readonly title = inject(Title);
  private readonly meta = inject(Meta);

  override updateTitle(snapshot: RouterStateSnapshot): void {
    const pageTitle = this.buildTitle(snapshot);
    const fullTitle = pageTitle ? `${pageTitle} · ${APP_NAME}` : APP_NAME;
    this.title.setTitle(fullTitle);

    const description =
      this.findDescription(snapshot.root) ?? DEFAULT_DESCRIPTION;
    this.meta.updateTag({ name: "description", content: description });
    this.meta.updateTag({ property: "og:description", content: description });
    this.meta.updateTag({ name: "twitter:description", content: description });
    this.meta.updateTag({ property: "og:title", content: fullTitle });
    this.meta.updateTag({ name: "twitter:title", content: fullTitle });
  }

  /**
   * Walks the activated route tree for the deepest `description` in route
   * data, mirroring how `buildTitle` resolves the title for nested routes.
   */
  private findDescription(route: ActivatedRouteSnapshot): string | undefined {
    return route.firstChild
      ? (this.findDescription(route.firstChild) ??
          (route.data["description"] as string | undefined))
      : (route.data["description"] as string | undefined);
  }
}
