import type { IArticleRepository } from '../../domain/repositories/article.repository.interface.js';
import type { IPostRepository } from '../../domain/repositories/post.repository.interface.js';
import type { IFacebookService } from '../../domain/services/facebook.service.interface.js';
import type { ILoggerService } from '../../domain/services/logger.service.interface.js';
import { PostStatus } from '../../shared/enums/post-status.enum.js';
import type { CreatePostDto } from '../dto/create-post.dto.js';
import type { FacebookPostDto, FacebookPostResultDto } from '../dto/facebook-post.dto.js';

export class PublishFacebookPostUseCase {
  constructor(
    private readonly articleRepository: IArticleRepository,
    private readonly postRepository: IPostRepository,
    private readonly facebookService: IFacebookService,
    private readonly logger: ILoggerService,
  ) {}

  async execute(input: FacebookPostDto): Promise<FacebookPostResultDto> {
    if (!this.facebookService.isConfigured()) {
      throw new Error('Facebook credentials are not configured');
    }

    this.logger.info('Publishing Facebook post', { imagePath: input.imagePath });

    const result = await this.facebookService.publishPhotoPost(
      input.caption,
      input.imagePath,
    );

    this.logger.info('Facebook post published', {
      facebookPostId: result.facebookPostId,
      photoId: result.photoId,
    });

    return {
      facebookPostId: result.facebookPostId,
      photoId: result.photoId,
    };
  }

  async savePost(dto: CreatePostDto, result: FacebookPostResultDto): Promise<void> {
    await this.postRepository.create({
      articleId: dto.articleId,
      caption: dto.caption,
      imagePath: dto.imagePath,
      facebookPostId: result.facebookPostId,
    });

    await this.articleRepository.markAsPosted(dto.articleId);

    this.logger.info('Post saved and article marked as posted', {
      articleId: dto.articleId,
      status: dto.status ?? PostStatus.PUBLISHED,
    });
  }
}
