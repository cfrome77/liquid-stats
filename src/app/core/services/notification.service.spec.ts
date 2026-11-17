import { TestBed } from "@angular/core/testing";
import { MatSnackBar } from "@angular/material/snack-bar";

import {
  NotificationService,
  NOTIFICATION_DEFAULT_DURATION,
} from "./notification.service";

describe("NotificationService", () => {
  let service: NotificationService;
  let snackBar: jasmine.SpyObj<MatSnackBar>;

  beforeEach(() => {
    snackBar = jasmine.createSpyObj<MatSnackBar>("MatSnackBar", [
      "open",
      "dismiss",
    ]);
    snackBar.open.and.returnValue({
      onAction: () => ({ subscribe: () => undefined }),
    } as never);

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: MatSnackBar, useValue: snackBar },
      ],
    });

    service = TestBed.inject(NotificationService);
  });

  it("shows a message with the default info level and duration", () => {
    service.show("Saved");

    expect(snackBar.open).toHaveBeenCalledOnceWith(
      "Saved",
      "",
      jasmine.objectContaining({
        duration: NOTIFICATION_DEFAULT_DURATION,
        panelClass: ["app-notification", "app-notification--info"],
      }),
    );
  });

  it("tags error messages so the fallback UI can be styled", () => {
    service.error("Unable to load data", "Retry");

    expect(snackBar.open).toHaveBeenCalledOnceWith(
      "Unable to load data",
      "Retry",
      jasmine.objectContaining({
        panelClass: ["app-notification", "app-notification--error"],
      }),
    );
  });

  it("tags success messages", () => {
    service.success("Done");

    expect(snackBar.open).toHaveBeenCalledOnceWith(
      "Done",
      "",
      jasmine.objectContaining({
        panelClass: ["app-notification", "app-notification--success"],
      }),
    );
  });

  it("returns the snack bar ref so callers can react to the action", () => {
    const ref = service.error("Failed", "Retry");
    expect(ref).toBeDefined();
    expect(ref.onAction).toBeDefined();
  });

  it("dismisses the current toast", () => {
    service.dismiss();
    expect(snackBar.dismiss).toHaveBeenCalled();
  });
});
