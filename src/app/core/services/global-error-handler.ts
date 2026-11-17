import { ErrorHandler, Injectable, inject } from "@angular/core";
import { LoggingService } from "./logger.service";
import { NotificationService } from "./notification.service";

/**
 * Application-wide error boundary. Angular routes every uncaught error
 * (template, lifecycle hook, and unhandled async callback) through
 * `ErrorHandler`, so overriding it gives the app one place to log the failure
 * and surface a user-facing message instead of leaving a blank screen.
 *
 * Errors that originate from a failed HTTP call are already reported by the
 * feature that owns the request (with a retry action), so those are logged
 * only to avoid double-reporting them to the user.
 */
@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private logger = inject(LoggingService);
  private notifications = inject(NotificationService);

  handleError(error: unknown): void {
    this.logger.error("Uncaught application error", error);

    if (this.isHttpError(error)) return;

    try {
      this.notifications.error(
        "Something went wrong. Please try again.",
        "Dismiss",
      );
    } catch (notificationError) {
      // A failure while reporting an error must never mask the original one.
      this.logger.error(
        "Failed to surface error notification",
        notificationError,
      );
    }
  }

  private isHttpError(error: unknown): boolean {
    if (!error || typeof error !== "object") return false;
    const candidate = error as { name?: string; status?: number };
    return (
      candidate.name === "HttpErrorResponse" ||
      typeof candidate.status === "number"
    );
  }
}
