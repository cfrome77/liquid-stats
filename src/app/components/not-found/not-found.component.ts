import { Component, inject } from "@angular/core";
import { Router, RouterModule } from "@angular/router";

import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";

interface QuickLink {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: "app-not-found",
  standalone: true,
  imports: [RouterModule, MatButtonModule, MatIconModule],
  template: `
    <div class="nf-container">
      <div class="nf-glow" aria-hidden="true"></div>

      <div class="nf-pint" aria-hidden="true">
        <svg class="nf-glass" viewBox="0 0 140 180" role="presentation">
          <defs>
            <linearGradient id="nf-beer" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stop-color="#ffca28" />
              <stop offset="100%" stop-color="#e65100" />
            </linearGradient>
            <clipPath id="nf-clip">
              <path
                d="M34 34 H106 L96 166 Q95 172 88 172 H52 Q45 172 44 166 Z"
              />
            </clipPath>
          </defs>

          <!-- Beer body -->
          <g clip-path="url(#nf-clip)">
            <rect class="nf-liquid" x="24" y="58" width="92" height="130" />
            <rect class="nf-foam" x="24" y="52" width="92" height="14" />
          </g>

          <!-- Glass outline -->
          <path
            class="nf-outline"
            d="M34 34 H106 L96 166 Q95 172 88 172 H52 Q45 172 44 166 Z"
          />
          <line class="nf-rim" x1="32" y1="34" x2="108" y2="34" />
        </svg>

        <span class="nf-bubble nf-bubble-1"></span>
        <span class="nf-bubble nf-bubble-2"></span>
        <span class="nf-bubble nf-bubble-3"></span>
        <span class="nf-bubble nf-bubble-4"></span>
      </div>

      <p class="nf-code" aria-hidden="true">404</p>
      <h1 class="nf-title">This page went flat</h1>
      <p class="nf-message">
        We tapped around but couldn't find the page you're after. It may have
        been moved, renamed, or never poured in the first place.
      </p>

      <div class="nf-actions">
        <button mat-flat-button class="nf-primary" (click)="goHome()">
          <mat-icon>local_bar</mat-icon>
          Back to the taproom
        </button>
        <button mat-stroked-button class="nf-secondary" (click)="goBack()">
          <mat-icon>undo</mat-icon>
          Take me back
        </button>
      </div>

      <nav class="nf-links" aria-label="Popular pages">
        <span class="nf-links-label">Or try a fresh pour:</span>
        <div class="nf-links-row">
          @for (link of quickLinks; track link.path) {
            <a mat-button [routerLink]="link.path" class="nf-link">
              <mat-icon>{{ link.icon }}</mat-icon>
              {{ link.label }}
            </a>
          }
        </div>
      </nav>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .nf-container {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: calc(100vh - 64px);
        padding: 48px 16px;
        text-align: center;
        overflow: hidden;
        color: var(--text-color);
      }

      .nf-glow {
        position: absolute;
        inset: -20% 0 auto 0;
        height: 60%;
        background: var(--hero-glow);
        pointer-events: none;
      }

      /* Pint glass + rising bubbles */
      .nf-pint {
        position: relative;
        width: 140px;
        height: 180px;
        margin-bottom: 8px;
        filter: drop-shadow(0 12px 24px rgba(0, 0, 0, 0.18));
      }

      .nf-glass {
        width: 100%;
        height: 100%;
        overflow: visible;
      }

      .nf-liquid {
        fill: url(#nf-beer);
        transform-origin: center bottom;
        animation: nf-slosh 4.5s ease-in-out infinite;
      }

      .nf-foam {
        fill: #fff8e7;
        opacity: 0.95;
        animation: nf-foam 4.5s ease-in-out infinite;
      }

      .nf-outline {
        fill: none;
        stroke: var(--glass-border, rgba(0, 0, 0, 0.35));
        stroke-width: 4;
        stroke-linejoin: round;
        opacity: 0.8;
      }

      .nf-rim {
        stroke: var(--glass-border, rgba(0, 0, 0, 0.35));
        stroke-width: 4;
        stroke-linecap: round;
        opacity: 0.8;
      }

      .nf-bubble {
        position: absolute;
        bottom: 22px;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.75);
        opacity: 0;
        animation: nf-rise 3.6s ease-in infinite;
      }

      .nf-bubble-1 {
        left: 48px;
        animation-delay: 0s;
      }
      .nf-bubble-2 {
        left: 68px;
        width: 7px;
        height: 7px;
        animation-delay: 0.9s;
      }
      .nf-bubble-3 {
        left: 84px;
        width: 12px;
        height: 12px;
        animation-delay: 1.8s;
      }
      .nf-bubble-4 {
        left: 58px;
        width: 6px;
        height: 6px;
        animation-delay: 2.6s;
      }

      .nf-code {
        margin: 0;
        font-family: "Montserrat", sans-serif;
        font-size: clamp(3.5rem, 14vw, 6rem);
        font-weight: 800;
        line-height: 1;
        letter-spacing: 0.06em;
        color: var(--accent-glow);
        opacity: 0.9;
      }

      .nf-title {
        margin: 4px 0 12px;
        font-family: "Montserrat", sans-serif;
        font-size: clamp(1.4rem, 5vw, 2rem);
        font-weight: 700;
        letter-spacing: 0.02em;
        color: var(--header-text);
      }

      .nf-message {
        max-width: 460px;
        margin: 0 auto 28px;
        font-size: 1.05rem;
        line-height: 1.6;
        opacity: 0.8;
      }

      .nf-actions {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        justify-content: center;
        margin-bottom: 36px;
      }

      .nf-actions button {
        border-radius: 24px;
        font-weight: 700;
        padding: 0 22px;
      }

      .nf-primary {
        background-color: var(--btn-danger) !important;
        color: #fff !important;
      }

      .nf-secondary {
        border-color: var(--accent-glow) !important;
        color: var(--accent-glow) !important;
      }

      .nf-links {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        opacity: 0.9;
      }

      .nf-links-label {
        font-size: 0.85rem;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        opacity: 0.6;
      }

      .nf-links-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        justify-content: center;
      }

      .nf-link {
        color: var(--accent-blue) !important;
        font-weight: 600;
      }

      .nf-link mat-icon {
        margin-right: 4px;
      }

      @keyframes nf-slosh {
        0%,
        100% {
          transform: rotate(0deg);
        }
        50% {
          transform: rotate(-1.2deg);
        }
      }

      @keyframes nf-foam {
        0%,
        100% {
          transform: translateY(0);
        }
        50% {
          transform: translateY(2px);
        }
      }

      @keyframes nf-rise {
        0% {
          transform: translateY(0) scale(0.6);
          opacity: 0;
        }
        15% {
          opacity: 0.9;
        }
        100% {
          transform: translateY(-110px) scale(1);
          opacity: 0;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .nf-liquid,
        .nf-foam,
        .nf-bubble {
          animation: none;
        }
      }

      @media (max-width: 480px) {
        .nf-pint {
          width: 112px;
          height: 144px;
        }
        .nf-actions {
          flex-direction: column;
          width: 100%;
        }
        .nf-actions button {
          width: 100%;
        }
      }
    `,
  ],
})
export class NotFoundComponent {
  private router = inject(Router);

  readonly quickLinks: QuickLink[] = [
    { path: "/checkins", label: "Checkins", icon: "room" },
    { path: "/top-beers", label: "Top Drinks", icon: "emoji_events" },
    { path: "/stats", label: "Stats", icon: "insert_chart" },
    { path: "/map", label: "Map", icon: "map" },
  ];

  goHome(): void {
    this.router.navigate(["/"]);
  }

  goBack(): void {
    window.history.back();
  }
}
