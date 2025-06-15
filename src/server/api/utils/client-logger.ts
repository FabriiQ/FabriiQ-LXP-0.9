/**
 * Client-side logger
 * 
 * A simple logger for client-side code that supports different log levels
 * and can be configured to disable logging in production.
 */

// Log levels
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Logger configuration
interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  prefix?: string;
}

// Default configuration
const defaultConfig: LoggerConfig = {
  enabled: process.env.NODE_ENV !== 'production',
  level: 'info',
  prefix: '[Aivy]'
};

// Current configuration
let config = { ...defaultConfig };

// Log level priorities (higher number = higher priority)
const logLevelPriority: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

/**
 * Check if a log level should be displayed based on the current configuration
 */
function shouldLog(level: LogLevel): boolean {
  if (!config.enabled) return false;
  return logLevelPriority[level] >= logLevelPriority[config.level];
}

/**
 * Format log data for output
 */
function formatLogData(data: any): string {
  try {
    return typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
  } catch (error) {
    return '[Unserializable data]';
  }
}

/**
 * Configure the logger
 */
function configure(newConfig: Partial<LoggerConfig>): void {
  config = { ...config, ...newConfig };
}

/**
 * Log a debug message
 */
function debug(message: string, data?: any): void {
  if (shouldLog('debug')) {
    console.debug(`${config.prefix} ${message}`, data !== undefined ? data : '');
  }
}

/**
 * Log an info message
 */
function info(message: string, data?: any): void {
  if (shouldLog('info')) {
    console.info(`${config.prefix} ${message}`, data !== undefined ? data : '');
  }
}

/**
 * Log a warning message
 */
function warn(message: string, data?: any): void {
  if (shouldLog('warn')) {
    console.warn(`${config.prefix} ${message}`, data !== undefined ? data : '');
  }
}

/**
 * Log an error message
 */
function error(message: string, data?: any): void {
  if (shouldLog('error')) {
    console.error(`${config.prefix} ${message}`, data !== undefined ? data : '');
  }
}

// Export the logger
export const logger = {
  configure,
  debug,
  info,
  warn,
  error
};
