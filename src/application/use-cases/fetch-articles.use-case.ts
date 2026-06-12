import type { Article } from '../../domain/entities/article.entity.js';
import type { RssSource } from '../../domain/entities/rss-source.entity.js';
import type { IArticleRepository } from '../../domain/repositories/article.repository.interface.js';
import type { IDuplicateDetectionService } from '../../domain/services/duplicate-detection.service.interface.js';
import type { ILoggerService } from '../../domain/services/logger.service.interface.js';
import type { IRssService } from '../../domain/services/rss.service.interface.js';

export class FetchArticlesUseCase {
  constructor(
    private readonly articleRepository: IArticleRepository,
    private readonly rssService: IRssService,
    private readonly duplicateDetectionService: IDuplicateDetectionService,
    private readonly logger: ILoggerService,
  ) {}

  async execute(sources: RssSource[]): Promise<Article[]> {
    const enabledSources = sources.filter((source) => source.enabled);
    this.logger.info('Fetching RSS feeds', { count: enabledSources.length });

    const feedItems = await this.rssService.fetchAllFeeds(enabledSources);
    const savedArticles: Article[] = [];

    for (const item of feedItems) {
      const isDuplicate = await this.duplicateDetectionService.isDuplicate(
        item.url,
        item.title,
      );

      if (isDuplicate) {
        this.logger.warn('Duplicate article skipped', {
          title: item.title,
          url: item.url,
        });
        continue;
      }

      const article = await this.articleRepository.create({
        source: item.source,
        title: item.title,
        url: item.url,
        content: item.content,
        summary: '',
        caption: '',
        imageUrl: item.imageUrl,
        mainPerson: '',
        publishedAt: item.publishedAt,
        posted: false,
      });

      savedArticles.push(article);
      this.logger.info('Article saved', { articleId: article.id, title: article.title });
    }

    this.logger.info('RSS fetch completed', {
      fetched: feedItems.length,
      saved: savedArticles.length,
    });

    return savedArticles;
  }
}
