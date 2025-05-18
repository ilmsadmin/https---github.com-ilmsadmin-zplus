/**
 * Simple logger implementation that can be extended or replaced
 */
export class Logger {
  private serviceName: string;

  constructor(serviceName: string) {
    this.serviceName = serviceName;
  }

  /**
   * Format a log message with metadata
   */
  private formatMessage(message: string, meta?: any): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${this.serviceName}] ${message}${metaStr}`;
  }

  /**
   * Log debug message
   */
  debug(message: string, meta?: any): void {
    console.debug(this.formatMessage(message, meta));
  }

  /**
   * Log info message
   */
  info(message: string, meta?: any): void {
    console.info(this.formatMessage(message, meta));
  }

  /**
   * Log warning message
   */
  warn(message: string, meta?: any): void {
    console.warn(this.formatMessage(message, meta));
  }

  /**
   * Log error message
   */
  error(message: string, meta?: any): void {
    console.error(this.formatMessage(message, meta));
  }
}
