const LOG_LEVEL = {
  INFO: 0,
  WARN: 1,
  DEBUG: 2,
  TRACE: 3,
  ERROR: 4,
};

const isLoggerEnabled =
  import.meta.env.VITE_LOGGER_ENV?.toLowerCase() === 'true';
const CURRENT_LOG_LEVEL = isLoggerEnabled ? LOG_LEVEL.INFO : LOG_LEVEL.ERROR;

/**
 * Logger class for logging messages
 * @class
 */
class Logger {
  /**
   * Log an info message
   * @param message The message to log
   * @param args Optional arguments to log
   */
  static info(message: string, ...args: any[]) {
    if (CURRENT_LOG_LEVEL <= LOG_LEVEL.INFO) {
      console.log(`INFO: ${message}`, ...args);
    }
  }

  /**
   * Log an error message
   * @param message The message to log
   * @param args Optional arguments to log
   */
  static error(message: string, ...args: any[]) {
    if (CURRENT_LOG_LEVEL <= LOG_LEVEL.ERROR) {
      console.error(`ERROR: ${message}`, ...args);
    }
  }

  /**
   * Log a warning message
   * @param message The message to log
   * @param args Optional arguments to log
   */
  static warn(message: string, ...args: any[]) {
    if (CURRENT_LOG_LEVEL <= LOG_LEVEL.WARN) {
      console.warn(`WARN: ${message}`, ...args);
    }
  }

  /**
   * Log a debug message
   * @param message The message to log
   * @param args Optional arguments to log
   */
  static debug(message: string, ...args: any[]) {
    if (CURRENT_LOG_LEVEL <= LOG_LEVEL.DEBUG) {
      console.debug(`DEBUG: ${message}`, ...args);
    }
  }

  /**
   * Log a trace message
   * @param message The message to log
   * @param args Optional arguments to log
   */
  static trace(message: string, ...args: any[]) {
    if (CURRENT_LOG_LEVEL <= LOG_LEVEL.TRACE) {
      console.trace(`TRACE: ${message}`, ...args);
    }
  }
}

export default Logger;
