import { Injectable, isDevMode } from "@angular/core";

// Declare the global gtag function
// Fixed: Replaced 'any' with 'string | number | boolean | undefined' for GA4 params
declare let gtag: (
  command: string,
  eventName: string,
  params: { [key: string]: string | number | boolean | undefined },
) => void;

@Injectable({ providedIn: "root" })
export class LoggingService {
  private readonly devMode = isDevMode();

  // Define maximum character length for GA4 custom dimensions (100 characters)
  private readonly MAX_GA4_PARAM_LENGTH = 100;

  private sendGaEvent(level: string, message: string, data?: unknown): void {
    if (typeof gtag !== "undefined") {
      const eventName =
        level === "error" || level === "warn" ? "exception" : "app_log";

      const truncatedMessage = message.substring(0, this.MAX_GA4_PARAM_LENGTH);
      const dataJson = data ? JSON.stringify(data) : "";
      const truncatedData = dataJson.substring(0, this.MAX_GA4_PARAM_LENGTH);

      const eventParams = {
        description: truncatedMessage,
        log_level: level,
        log_message: truncatedMessage,
        data_json: data ? truncatedData : undefined,
        fatal: level === "error" || level === "warn" ? false : undefined,
      };

      gtag("event", eventName, eventParams);
    }
  }

  /**
   * General purpose log. Only logs to console in development mode.
   */
  log(message: string, data?: unknown): void {
    if (this.devMode) {
      // eslint-disable-next-line no-console
      console.log(`[LOG] ${message}`, data ?? "");
    }
  }

  /**
   * Information log.
   */
  info(message: string, data?: unknown): void {
    if (this.devMode) {
      // eslint-disable-next-line no-console
      console.info(`[INFO] ${message}`, data ?? "");
    }
    if (!this.devMode) {
      this.sendGaEvent("info", message, data);
    }
  }

  /**
   * Warning log.
   */
  warn(message: string, data?: unknown): void {
    if (this.devMode) {
      console.warn(`[WARN] ${message}`, data ?? "");
    }
    if (!this.devMode) {
      this.sendGaEvent("warn", message, data);
    }
  }

  /**
   * Error log.
   */
  error(message: string, data?: unknown): void {
    if (this.devMode) {
      console.error(`[ERROR] ${message}`, data ?? "");
    }
    if (!this.devMode) {
      this.sendGaEvent("error", message, data);
    }
  }
}
