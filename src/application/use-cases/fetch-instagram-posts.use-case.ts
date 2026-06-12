import type { Article } from '../../domain/entities/article.entity.js';
import type { IArticleRepository } from '../../domain/repositories/article.repository.interface.js';
import type { IDuplicateDetectionService } from '../../domain/services/duplicate-detection.service.interface.js';
import type { IInstagramService } from '../../domain/services/instagram.service.interface.js';
import type { ILoggerService } from '../../domain/services/logger.service.interface.js';
import {
  captionToTitle,
  matchesInstagramKeywords,
} from '../../shared/utils/instagram-filter.util.js';

export class FetchInstagramPostsUseCase {
  constructor(
    private readonly articleRepository: IArticleRepository,
    private readonly instagramService: IInstagramService,
    private readonly duplicateDetectionService: IDuplicateDetectionService,
    private readonly logger: ILoggerService,
    private readonly sourceName: string,
    private readonly keywords: string[],
  ) {}

  async execute(): Promise<Article[]> {
    if (!this.instagramService.isConfigured()) {
      this.logger.info('Instagram fetch skipped (not configured)');
      return [];
    }

    this.logger.info('Fetching Instagram posts', { source: this.sourceName });

    const posts = await this.instagramService.fetchRecentPosts();
    const savedArticles: Article[] = [];

    for (const post of posts) {
      if (!matchesInstagramKeywords(post.caption, this.keywords)) {
        this.logger.info('Instagram post skipped (no Arsenal keyword match)', {
          postId: post.id,
        });
        continue;
      }

      const title = captionToTitle(
        post.caption,
        `Instagram @${post.username}`,
      );

      const isDuplicate = await this.duplicateDetectionService.isDuplicate(
        post.permalink,
        title,
      );

      if (isDuplicate) {
        this.logger.warn('Duplicate Instagram post skipped', {
          title,
          url: post.permalink,
        });
        continue;
      }

      const article = await this.articleRepository.create({
        source: this.sourceName,
        title,
        url: post.permalink,
        content: post.caption,
        summary: '',
        caption: '',
        imageUrl: post.imageUrl,
        mainPerson: '',
        publishedAt: post.publishedAt,
        posted: false,
      });

      savedArticles.push(article);
      this.logger.info('Instagram post saved', {
        articleId: article.id,
        title: article.title,
      });
    }

    this.logger.info('Instagram fetch completed', {
      fetched: posts.length,
      saved: savedArticles.length,
    });

    return savedArticles;
  }
}
