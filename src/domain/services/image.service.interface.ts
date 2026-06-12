import type {
  GeneratedImage,
  ImageGenerationInput,
} from '../../shared/types/image.types.js';

export interface IImageService {
  generate(input: ImageGenerationInput): Promise<GeneratedImage>;
}
