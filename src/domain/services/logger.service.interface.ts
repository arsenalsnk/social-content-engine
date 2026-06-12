import type { LogLevel } from '../../shared/enums/log-level.enum.js';

export interface ILoggerService {
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}

export type { LogLevel };
