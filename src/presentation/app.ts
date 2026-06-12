import 'dotenv/config';

import { createDependencyContainer } from '../container/dependency-container.js';

export function bootstrap(): void {
  const container = createDependencyContainer();

  container.cronScheduler.start();
  container.logger.info('Application started', {
    cronSchedule: process.env.CRON_SCHEDULE ?? '*/15 * * * *',
  });

  const shutdown = (): void => {
    container.cronScheduler.stop();
    container.logger.info('Application stopped');
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap();
