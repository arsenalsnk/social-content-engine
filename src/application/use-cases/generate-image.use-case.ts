import type { IImageService } from '../../domain/services/image.service.interface.js';
import type { ILoggerService } from '../../domain/services/logger.service.interface.js';
import type { ImageTemplateType } from '../../shared/enums/image-template-type.enum.js';
import type { GeneratedImage } from '../../shared/types/image.types.js';

export interface GenerateImageInput {
  articleId: string;
  title: string;
  caption: string;
  templateType: ImageTemplateType;
  imageUrl?: string;
  mainPerson?: string;
}

export class GenerateImageUseCase {
  constructor(
    private readonly imageService: IImageService,
    private readonly logger: ILoggerService,
  ) {}

  async execute(input: GenerateImageInput): Promise<GeneratedImage> {
    this.logger.info('Generating image', {
      articleId: input.articleId,
      templateType: input.templateType,
      hasImageUrl: Boolean(input.imageUrl),
      mainPerson: input.mainPerson ?? null,
    });

    const image = await this.imageService.generate({
      title: input.title,
      caption: input.caption,
      templateType: input.templateType,
      themeSeed: input.articleId,
      ...(input.imageUrl ? { imageUrl: input.imageUrl } : {}),
      ...(input.mainPerson ? { mainPerson: input.mainPerson } : {}),
    });

    this.logger.info('Image generated', {
      articleId: input.articleId,
      imagePath: image.imagePath,
    });

    return image;
  }
}
