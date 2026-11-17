import { Injectable, inject } from "@angular/core";
import {
  MatSnackBar,
  MatSnackBarConfig,
  MatSnackBarRef,
  TextOnlySnackBar,
} from "@angular/material/snack-bar";

/** Severity of a user-facing message, used to pick the toast styling. */
export type NotificationLevel = "error" | "info" | "success";

/** Milliseconds a message stays on screen when the caller does not say. */
export const NOTIFICATION_DEFAULT_DURATION = 6000;

/**
 * Thin, testable wrapper around `MatSnackBar` so features never talk to the
 * Material API directly. Callers get the `MatSnackBarRef` back when they need
 * to react to the action button (for example a "Retry" that refetches data).
 */
@Injectable({ providedIn: "root" })
export class NotificationService {
  private snackBar = inject(MatSnackBar);

  show(
    message: string,
    action = "",
    level: NotificationLevel = "info",
    duration = NOTIFICATION_DEFAULT_DURATION,
  ): MatSnackBarRef<TextOnlySnackBar> {
    const config: MatSnackBarConfig = {
      duration,
      horizontalPosition: "center",
      verticalPosition: "bottom",
      panelClass: ["app-notification", `app-notification--${level}`],
    };
    return this.snackBar.open(message, action, config);
  }

  /** A failed operation, optionally offering a single recovery action. */
  error(
    message: string,
    action = "",
    duration = NOTIFICATION_DEFAULT_DURATION,
  ): MatSnackBarRef<TextOnlySnackBar> {
    return this.show(message, action, "error", duration);
  }

  /** A completed operation the user should know about. */
  success(
    message: string,
    action = "",
    duration = NOTIFICATION_DEFAULT_DURATION,
  ): MatSnackBarRef<TextOnlySnackBar> {
    return this.show(message, action, "success", duration);
  }

  /** Neutral, non-critical information. */
  info(
    message: string,
    action = "",
    duration = NOTIFICATION_DEFAULT_DURATION,
  ): MatSnackBarRef<TextOnlySnackBar> {
    return this.show(message, action, "info", duration);
  }

  dismiss(): void {
    this.snackBar.dismiss();
  }
}
