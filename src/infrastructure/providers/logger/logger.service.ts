import type { ILoggerService } from '../../../domain/services/logger.service.interface.js';
import { LogLevel } from '../../../shared/enums/log-level.enum.js';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  [LogLevel.INFO]: 1,
  [LogLevel.WARN]: 2,
  [LogLevel.ERROR]: 3,
};

export class LoggerService implements ILoggerService {
  constructor(private readonly minLevel: LogLevel = LogLevel.INFO) {}

  info(message: string, meta?: Record<string, unknown>): void {
    this.write(LogLevel.INFO, message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.write(LogLevel.WARN, message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.write(LogLevel.ERROR, message, meta);
  }

  private write(
    level: LogLevel,
    message: string,
    meta?: Record<string, unknown>,
  ): void {
    if (LOG_LEVEL_PRIORITY[level] < LOG_LEVEL_PRIORITY[this.minLevel]) {
      return;
    }

    const timestamp = new Date().toISOString();
    const suffix = meta ? ` ${JSON.stringify(meta)}` : '';

    console.log(`[${timestamp}] [${level}] ${message}${suffix}`);
  }
}
