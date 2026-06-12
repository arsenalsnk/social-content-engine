import { loadEnvConfig } from '../config/index.js';
import { ContentPipelineUseCase } from '../application/use-cases/content-pipeline.use-case.js';
import { FetchArticlesUseCase } from '../application/use-cases/fetch-articles.use-case.js';
import { FetchInstagramPostsUseCase } from '../application/use-cases/fetch-instagram-posts.use-case.js';
import { SummarizeArticleUseCase } from '../application/use-cases/summarize-article.use-case.js';
import { GenerateImageUseCase } from '../application/use-cases/generate-image.use-case.js';
import { PublishFacebookPostUseCase } from '../application/use-cases/publish-facebook-post.use-case.js';
import { FirestoreClient } from '../infrastructure/database/firestore/firestore.client.js';
import {
  FirestoreArticleRepository,
  FirestorePostRepository,
  FirestoreSettingsRepository,
} from '../infrastructure/repositories/index.js';
import { RssService } from '../infrastructure/providers/rss/index.js';
import { createLlmService } from '../infrastructure/providers/llm/index.js';
import type { ILlmService } from '../domain/services/llm.service.interface.js';
import { FacebookService } from '../infrastructure/providers/facebook/index.js';
import { InstagramService } from '../infrastructure/providers/instagram/index.js';
import { ImageService } from '../infrastructure/providers/image/index.js';
import { ArticleImageEnrichmentService } from '../infrastructure/providers/image/article-image-enrichment.service.js';
import {
  PexelsProvider,
  StockImageService,
} from '../infrastructure/providers/stock-image/index.js';
import { DuplicateDetectionService } from '../infrastructure/providers/duplicate-detection/index.js';
import { LoggerService } from '../infrastructure/providers/logger/index.js';
import { LogLevel } from '../shared/enums/log-level.enum.js';
import { ContentPipelineJob } from '../jobs/content-pipeline.job.js';
import { CronScheduler } from '../jobs/cron.scheduler.js';

export class DependencyContainer {
  readonly firestoreClient: FirestoreClient;
  readonly articleRepository: FirestoreArticleRepository;
  readonly postRepository: FirestorePostRepository;
  readonly settingsRepository: FirestoreSettingsRepository;
  readonly rssService: RssService;
  readonly instagramService: InstagramService;
  readonly llmService: ILlmService;
  readonly facebookService: FacebookService;
  readonly imageService: ImageService;
  readonly duplicateDetectionService: DuplicateDetectionService;
  readonly logger: LoggerService;
  readonly fetchArticlesUseCase: FetchArticlesUseCase;
  readonly fetchInstagramPostsUseCase: FetchInstagramPostsUseCase;
  readonly summarizeArticleUseCase: SummarizeArticleUseCase;
  readonly generateImageUseCase: GenerateImageUseCase;
  readonly publishFacebookPostUseCase: PublishFacebookPostUseCase;
  readonly contentPipelineUseCase: ContentPipelineUseCase;
  readonly contentPipelineJob: ContentPipelineJob;
  readonly cronScheduler: CronScheduler;

  constructor() {
    const env = loadEnvConfig();
    const facebookEnabled = Boolean(
      env.facebook.pageId && env.facebook.accessToken,
    );
    const instagramEnabled =
      env.instagram.enabled && facebookEnabled;

    this.firestoreClient = new FirestoreClient(env.firebase);
    this.articleRepository = new FirestoreArticleRepository(this.firestoreClient);
    this.postRepository = new FirestorePostRepository(this.firestoreClient);
    this.settingsRepository = new FirestoreSettingsRepository(this.firestoreClient);

    this.rssService = new RssService();
    this.instagramService = new InstagramService(
      env.facebook.pageId,
      env.facebook.accessToken,
      env.instagram.targetUsername,
      env.instagram.fetchLimit,
      instagramEnabled,
    );
    this.logger = new LoggerService(env.logLevel as LogLevel);
    this.llmService = createLlmService(env.llm, this.logger);
    this.facebookService = new FacebookService(
      env.facebook.pageId,
      env.facebook.accessToken,
      env.facebookRetryAttempts,
    );
    this.imageService = new ImageService(env.imageOutputDir);
    this.duplicateDetectionService = new DuplicateDetectionService(
      this.articleRepository,
    );
    this.fetchArticlesUseCase = new FetchArticlesUseCase(
      this.articleRepository,
      this.rssService,
      this.duplicateDetectionService,
      this.logger,
    );

    this.fetchInstagramPostsUseCase = new FetchInstagramPostsUseCase(
      this.articleRepository,
      this.instagramService,
      this.duplicateDetectionService,
      this.logger,
      env.instagram.sourceName,
      env.instagram.keywords,
    );

    this.summarizeArticleUseCase = new SummarizeArticleUseCase(
      this.articleRepository,
      this.llmService,
      this.logger,
    );

    this.generateImageUseCase = new GenerateImageUseCase(
      this.imageService,
      this.logger,
    );

    this.publishFacebookPostUseCase = new PublishFacebookPostUseCase(
      this.articleRepository,
      this.postRepository,
      this.facebookService,
      this.logger,
    );

    const stockImageService = new StockImageService(
      new PexelsProvider(env.stockImage.pexelsApiKey),
      env.stockImage.defaultPexelsQuery,
    );
    const articleImageEnrichmentService = new ArticleImageEnrichmentService(
      env.stockImage.useNewsImages,
      stockImageService,
    );

    this.contentPipelineUseCase = new ContentPipelineUseCase(
      this.articleRepository,
      this.fetchArticlesUseCase,
      this.fetchInstagramPostsUseCase,
      instagramEnabled,
      this.summarizeArticleUseCase,
      this.generateImageUseCase,
      this.publishFacebookPostUseCase,
      articleImageEnrichmentService,
      this.logger,
      facebookEnabled,
      env.pipelineBatchSize,
      env.articleFilter,
    );

    this.contentPipelineJob = new ContentPipelineJob(
      this.contentPipelineUseCase,
      env.rssSources,
    );

    this.cronScheduler = new CronScheduler(env.cronSchedule, this.contentPipelineJob);
  }
}

export function createDependencyContainer(): DependencyContainer {
  return new DependencyContainer();
}
