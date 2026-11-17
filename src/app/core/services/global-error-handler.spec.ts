import { TestBed } from "@angular/core/testing";
import { MatSnackBar } from "@angular/material/snack-bar";

import { GlobalErrorHandler } from "./global-error-handler";
import { LoggingService } from "./logger.service";
import { NotificationService } from "./notification.service";

describe("GlobalErrorHandler", () => {
  let handler: GlobalErrorHandler;
  let logger: jasmine.SpyObj<LoggingService>;
  let notifications: jasmine.SpyObj<NotificationService>;

  beforeEach(() => {
    logger = jasmine.createSpyObj<LoggingService>("LoggingService", [
      "log",
      "info",
      "warn",
      "error",
    ]);
    notifications = jasmine.createSpyObj<NotificationService>(
      "NotificationService",
      ["show", "error", "success", "info", "dismiss"],
    );
    notifications.error.and.returnValue({
      onAction: () => ({ subscribe: () => undefined }),
    } as never);

    TestBed.configureTestingModule({
      providers: [
        GlobalErrorHandler,
        { provide: LoggingService, useValue: logger },
        { provide: NotificationService, useValue: notifications },
        { provide: MatSnackBar, useValue: {} },
      ],
    });

    handler = TestBed.inject(GlobalErrorHandler);
  });

  it("logs the error and surfaces a toast for unexpected failures", () => {
    const error = new Error("boom");

    handler.handleError(error);

    expect(logger.error).toHaveBeenCalledWith(
      "Uncaught application error",
      error,
    );
    expect(notifications.error).toHaveBeenCalledWith(
      "Something went wrong. Please try again.",
      "Dismiss",
    );
  });

  it("does not double-report errors that already carry an HTTP status", () => {
    const httpError = { name: "HttpErrorResponse", status: 500 };

    handler.handleError(httpError);

    expect(logger.error).toHaveBeenCalled();
    expect(notifications.error).not.toHaveBeenCalled();
  });

  it("never throws when the notification layer fails", () => {
    notifications.error.and.throwError("snackbar unavailable");

    expect(() => handler.handleError(new Error("boom"))).not.toThrow();
    expect(logger.error).toHaveBeenCalledWith(
      "Failed to surface error notification",
      jasmine.any(Error),
    );
  });
});
