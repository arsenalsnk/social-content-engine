import type { ImageTemplateType } from '../enums/image-template-type.enum.js';

export interface ImageGenerationInput {
  title: string;
  caption: string;
  templateType: ImageTemplateType;
  themeSeed: string;
  imageUrl?: string;
  mainPerson?: string;
}

export interface GeneratedImage {
  imagePath: string;
  width: number;
  height: number;
}
