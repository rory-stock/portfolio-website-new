interface LogContext {
  error?: unknown;
  [key: string]: unknown;
}

type LogLevel = "debug" | "info" | "warn" | "error" | "unauthorized";

class Logger {
  private isDev = import.meta.dev;

  private log(level: LogLevel, message: string, context?: LogContext) {
    if (level === "debug" && !this.isDev) {
      return;
    }

    const prefix = `[${level.toUpperCase()}]`;

    switch (level) {
      case "debug":
        console.debug(prefix, message, context);
        break;

      case "info":
        console.info(prefix, message, context);
        break;

      case "warn":
        console.warn(prefix, message, context);
        break;

      case "unauthorized":
      case "error":
        console.error(prefix, message, context);
        break;
    }
  }

  debug(message: string, context?: LogContext) {
    this.log("debug", message, context);
  }

  info(message: string, context?: LogContext) {
    this.log("info", message, context);
  }

  warn(message: string, context?: LogContext) {
    this.log("warn", message, context);
  }

  unauthorized(message: string, context?: LogContext) {
    this.log("unauthorized", message, context);
  }

  error(message: string, context?: LogContext) {
    this.log("error", message, context);
  }
}

export const logger = new Logger();
