import { AppError } from './app.error.js';

export class RepositoryError extends AppError {
  constructor(message: string, cause?: unknown) {
    super(message, 'REPOSITORY_ERROR', cause);
    this.name = 'RepositoryError';
  }
}
