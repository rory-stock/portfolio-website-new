/**
 * Logger utility for structured logging
 * Provides consistent logging across the application
 */

type LogLevel = "debug" | "info" | "warn" | "error";

class Logger {
  private isDev = import.meta.dev;

  /**
   * Debug logs - only shown in development
   */
  debug(message: string, ...args: any[]) {
    if (this.isDev) {
      console.debug(`[DEBUG]`, message, ...args);
    }
  }

  /**
   * Info logs - general information
   */
  info(message: string, ...args: any[]) {
    console.info(`[INFO]`, message, ...args);
  }

  /**
   * Warning logs
   */
  warn(message: string, ...args: any[]) {
    console.warn(`[WARN]`, message, ...args);
  }

  /**
   * Unauthorized logs - always shown
   */
  unauthorized(message: string, ...args: any[]) {
    console.error(`[UNAUTHORIZED]`, message, ...args);
  }

  /**
   * Error logs - always shown
   * Use this for caught errors that need logging
   */
  error(message: string, error?: Error | unknown, ...args: any[]) {
    console.error(`[ERROR]`, message, error, ...args);
  }
}

export const logger = new Logger();
