import type { Article } from '../../domain/entities/article.entity.js';
import type { RssSource } from '../../domain/entities/rss-source.entity.js';
import type { IArticleRepository } from '../../domain/repositories/article.repository.interface.js';
import type { ILoggerService } from '../../domain/services/logger.service.interface.js';
import type { ArticleImageEnrichmentService } from '../../infrastructure/providers/image/article-image-enrichment.service.js';
import { ImageTemplateType } from '../../shared/enums/image-template-type.enum.js';
import { PostStatus } from '../../shared/enums/post-status.enum.js';
import {
  formatCalendarDay,
  isArticleEligible,
  sortByPublishedAtAsc,
  type ArticleDateFilterMode,
} from '../../shared/utils/article-date.util.js';
import { appendSourceCredit } from '../../shared/utils/source-credit.util.js';
import type { FetchArticlesUseCase } from './fetch-articles.use-case.js';
import type { FetchInstagramPostsUseCase } from './fetch-instagram-posts.use-case.js';
import type { GenerateImageUseCase } from './generate-image.use-case.js';
import type { PublishFacebookPostUseCase } from './publish-facebook-post.use-case.js';
import type { SummarizeArticleUseCase } from './summarize-article.use-case.js';

export class ContentPipelineUseCase {
  constructor(
    private readonly articleRepository: IArticleRepository,
    private readonly fetchArticlesUseCase: FetchArticlesUseCase,
    private readonly fetchInstagramPostsUseCase: FetchInstagramPostsUseCase,
    private readonly instagramEnabled: boolean,
    private readonly summarizeArticleUseCase: SummarizeArticleUseCase,
    private readonly generateImageUseCase: GenerateImageUseCase,
    private readonly publishFacebookPostUseCase: PublishFacebookPostUseCase,
    private readonly articleImageEnrichmentService: ArticleImageEnrichmentService,
    private readonly logger: ILoggerService,
    private readonly facebookEnabled: boolean,
    private readonly batchSize = 1,
    private readonly articleFilter: {
      mode: ArticleDateFilterMode;
      timezone: string;
      maxAgeHours: number;
    } = { mode: 'today', timezone: 'Asia/Bangkok', maxAgeHours: 48 },
  ) {}

  async execute(sources: RssSource[]): Promise<void> {
    this.logger.info('Content pipeline started');

    await this.fetchArticlesUseCase.execute(sources);

    if (this.instagramEnabled) {
      try {
        await this.fetchInstagramPostsUseCase.execute();
      } catch (error) {
        this.logger.error('Instagram fetch failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const referenceDate = new Date();
    const allPending = await this.articleRepository.findUnposted();
    const pendingArticles = sortByPublishedAtAsc(
      allPending.filter((article) =>
        isArticleEligible(article.publishedAt, this.articleFilter.mode, {
          maxAgeHours: this.articleFilter.maxAgeHours,
          timezone: this.articleFilter.timezone,
          referenceDate,
        }),
      ),
    );
    const processLimit =
      this.batchSize <= 0 ? pendingArticles.length : this.batchSize;
    const articlesToProcess = pendingArticles.slice(0, processLimit);

    if (allPending.length > pendingArticles.length) {
      this.logger.info('Skipped unposted articles outside filter window', {
        skippedCount: allPending.length - pendingArticles.length,
        filterMode: this.articleFilter.mode,
        timezone: this.articleFilter.timezone,
        ...(this.articleFilter.mode === 'hours'
          ? { maxArticleAgeHours: this.articleFilter.maxAgeHours }
          : {
              today: formatCalendarDay(referenceDate, this.articleFilter.timezone),
            }),
      });
    }

    this.logger.info('Processing unposted articles', {
      pending: pendingArticles.length,
      processing: articlesToProcess.length,
      filterMode: this.articleFilter.mode,
      timezone: this.articleFilter.timezone,
      oldestPendingAt: pendingArticles[0]?.publishedAt.toISOString() ?? null,
      newestPendingAt:
        pendingArticles[pendingArticles.length - 1]?.publishedAt.toISOString() ??
        null,
    });

    for (const article of articlesToProcess) {
      await this.processArticle(article);
    }

    this.logger.info('Content pipeline completed');
  }

  private async processArticle(article: Article): Promise<void> {
    try {
      const summaryResult = await this.ensureCaption(article);
      const mainPerson = summaryResult.mainPerson || article.mainPerson;

      const resolvedImage = await this.articleImageEnrichmentService.resolve(
        article,
        { mainPerson },
      );
      if (resolvedImage.imageUrl && resolvedImage.imageUrl !== article.imageUrl) {
        await this.articleRepository.update(article.id, {
          imageUrl: resolvedImage.imageUrl,
        });
        article = { ...article, imageUrl: resolvedImage.imageUrl };
      }

      this.logger.info('Article image resolved', {
        articleId: article.id,
        source: resolvedImage.source,
        query: resolvedImage.query ?? null,
        mainPerson: mainPerson || null,
        hasImage: Boolean(resolvedImage.imageUrl),
      });

      const image = await this.generateImageUseCase.execute({
        articleId: article.id,
        title: article.title,
        caption: summaryResult.caption,
        templateType: this.resolveTemplateType(article),
        ...(resolvedImage.imageUrl ? { imageUrl: resolvedImage.imageUrl } : {}),
        ...(mainPerson ? { mainPerson } : {}),
      });

      if (!this.facebookEnabled) {
        this.logger.warn('Facebook not configured, skipping publish', {
          articleId: article.id,
        });
        return;
      }

      const publishResult = await this.publishFacebookPostUseCase.execute({
        caption: summaryResult.caption,
        imagePath: image.imagePath,
      });

      await this.publishFacebookPostUseCase.savePost(
        {
          articleId: article.id,
          caption: summaryResult.caption,
          imagePath: image.imagePath,
          status: PostStatus.PUBLISHED,
        },
        publishResult,
      );
    } catch (error) {
      this.logger.error('Failed to process article', {
        articleId: article.id,
        title: article.title,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private async ensureCaption(article: Article): Promise<{
    caption: string;
    mainPerson: string;
  }> {
    if (article.caption.trim()) {
      return {
        caption: appendSourceCredit(article.caption, article.source, article.url),
        mainPerson: article.mainPerson,
      };
    }

    const result = await this.summarizeArticleUseCase.execute({
      articleId: article.id,
      title: article.title,
      content: article.content,
      sourceName: article.source,
      sourceUrl: article.url,
    });

    return {
      caption: result.caption,
      mainPerson: result.mainPerson,
    };
  }

  private resolveTemplateType(article: Article): ImageTemplateType {
    const normalized = `${article.source} ${article.title}`.toLowerCase();

    if (normalized.includes('transfer') || normalized.includes('signing')) {
      return ImageTemplateType.TRANSFER_NEWS;
    }

    if (normalized.includes('match') && normalized.includes('result')) {
      return ImageTemplateType.MATCH_RESULT;
    }

    if (normalized.includes('preview')) {
      return ImageTemplateType.MATCH_PREVIEW;
    }

    return ImageTemplateType.BREAKING_NEWS;
  }
}
