import { AppError } from './app.error.js';

export class ProviderError extends AppError {
  constructor(
    message: string,
    public readonly provider: string,
    cause?: unknown,
  ) {
    super(message, 'PROVIDER_ERROR', cause);
    this.name = 'ProviderError';
  }
}
