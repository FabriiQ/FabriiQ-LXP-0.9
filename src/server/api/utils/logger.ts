/**
 * Logger Utility
 * Provides standardized logging for the application
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogPayload {
  message: string;
  level: LogLevel;
  timestamp: string;
  [key: string]: unknown;
}

/**
 * Simple logger implementation
 * In production, this would be replaced with a more robust solution
 * like Winston, Pino, or a cloud logging service
 */
class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  /**
   * Log a debug message
   */
  debug(message: string, meta?: Record<string, unknown>): void {
    this.log('debug', message, meta);
  }

  /**
   * Log an info message
   */
  info(message: string, meta?: Record<string, unknown>): void {
    this.log('info', message, meta);
  }

  /**
   * Log a warning message
   */
  warn(message: string, meta?: Record<string, unknown>): void {
    this.log('warn', message, meta);
  }

  /**
   * Log an error message
   */
  error(message: string, meta?: Record<string, unknown>): void {
    this.log('error', message, meta);
  }

  /**
   * Internal logging method
   */
  private log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    
    // Process meta to safely handle errors
    let processedMeta = meta;
    if (meta) {
      // Clone the meta object to avoid mutation
      processedMeta = { ...meta };
      
      // Handle Error objects that may not serialize properly
      for (const key in processedMeta) {
        if (processedMeta[key] instanceof Error) {
          const err = processedMeta[key] as Error;
          processedMeta[key] = {
            name: err.name,
            message: err.message,
            stack: err.stack?.split('\n').slice(0, 3).join('\n'),
          };
        }
      }
    }
    
    const payload: LogPayload = {
      message,
      level,
      timestamp,
      ...processedMeta,
    };

    // In development, log to console
    if (this.isDevelopment) {
      const consoleMethod = this.getConsoleMethod(level);
      
      // Safely stringify meta data or use empty string
      let metaString = '';
      if (processedMeta) {
        try {
          metaString = JSON.stringify(processedMeta, null, 2);
        } catch (err) {
          metaString = '[Error: Unable to stringify meta data]';
        }
      }
      
      consoleMethod(`[${level.toUpperCase()}] ${message}`, metaString);
      return;
    }

    // In production, this would send logs to a proper logging service
    // For now, we'll just use console.log for all levels in production
    try {
      console.log(JSON.stringify(payload));
    } catch (err) {
      console.log(`[${level.toUpperCase()}] ${message} [Error: Unable to stringify payload]`);
    }
  }

  /**
   * Get the appropriate console method for the log level
   */
  private getConsoleMethod(level: LogLevel): typeof console.log {
    switch (level) {
      case 'debug':
        return console.debug;
      case 'info':
        return console.info;
      case 'warn':
        return console.warn;
      case 'error':
        return console.error;
      default:
        return console.log;
    }
  }
}

// Export a singleton instance
export const logger = new Logger(); 