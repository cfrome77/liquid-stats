import { Injectable, isDevMode } from "@angular/core";

// Declare the global gtag function
// This is necessary for TypeScript to recognize 'gtag' which is loaded via a script tag in index.html
declare var gtag: (
  command: string,
  eventName: string,
  params: { [key: string]: any },
) => void;

@Injectable({ providedIn: "root" })
export class LoggingService {
  private readonly devMode = isDevMode();

  // Define maximum character length for GA4 custom dimensions (100 characters)
  private readonly MAX_GA4_PARAM_LENGTH = 100;

  private sendGaEvent(level: string, message: string, data?: unknown): void {
    // Check if gtag is loaded before attempting to use it
    if (typeof gtag !== "undefined") {
      // Use 'exception' for errors/warnings, and 'app_log' for info.
      const eventName =
        level === "error" || level === "warn" ? "exception" : "app_log";

      // Truncate message and data to ensure compliance with GA4 reporting limits (100 chars)
      const truncatedMessage = message.substring(0, this.MAX_GA4_PARAM_LENGTH);
      const dataJson = data ? JSON.stringify(data) : "";
      const truncatedData = dataJson.substring(0, this.MAX_GA4_PARAM_LENGTH);

      const eventParams = {
        // GA4 Recommended: Use 'description' for the primary summary (max 100 chars)
        description: truncatedMessage,

        // Custom Dimensions: Ensure these parameters are registered in the GA4 UI
        log_level: level, // 'info', 'warn', 'error'
        log_message: truncatedMessage,
        data_json: data ? truncatedData : undefined,

        // Exception Parameter: 'fatal' for the 'exception' event
        // We set to false because these are caught client-side errors, not hard crashes.
        fatal: level === "error" || level === "warn" ? false : undefined,
      };

      gtag("event", eventName, eventParams);
    }
  }

  // --- Public Logging Methods ---

  /**
   * General purpose log. Only logs to console in development mode.
   * Not sent to Google Analytics to avoid event quota issues.
   */
  log(message: string, data?: unknown): void {
    if (this.devMode) {
      console.log(`[LOG] ${message}`, data ?? "");
    }
  }

  /**
   * Information log. Logs to console in dev mode, sends 'app_log' event to GA in production.
   */
  info(message: string, data?: unknown): void {
    if (this.devMode) {
      console.info(`[INFO] ${message}`, data ?? "");
    }
    if (!this.devMode) {
      this.sendGaEvent("info", message, data);
    }
  }

  /**
   * Warning log. Logs to console in dev mode, sends 'exception' event to GA in production.
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
   * Error log. Logs to console in dev mode, sends 'exception' event to GA in production.
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
