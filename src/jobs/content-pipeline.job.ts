import type { ContentPipelineUseCase } from '../application/use-cases/content-pipeline.use-case.js';
import type { RssSource } from '../domain/entities/rss-source.entity.js';

export class ContentPipelineJob {
  constructor(
    private readonly contentPipelineUseCase: ContentPipelineUseCase,
    private readonly rssSources: RssSource[],
  ) {}

  async execute(): Promise<void> {
    await this.contentPipelineUseCase.execute(this.rssSources);
  }
}
