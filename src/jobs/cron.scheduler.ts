import cron from 'node-cron';

import type { ContentPipelineJob } from './content-pipeline.job.js';

export class CronScheduler {
  private task: cron.ScheduledTask | null = null;

  constructor(
    private readonly cronSchedule: string,
    private readonly job: ContentPipelineJob,
  ) {}

  start(): void {
    if (this.task) {
      return;
    }

    if (!cron.validate(this.cronSchedule)) {
      throw new Error(`Invalid cron schedule: ${this.cronSchedule}`);
    }

    this.task = cron.schedule(this.cronSchedule, () => {
      void this.job.execute();
    });
  }

  stop(): void {
    this.task?.stop();
    this.task = null;
  }
}
