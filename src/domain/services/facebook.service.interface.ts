import type { FacebookPublishResult } from '../../shared/types/facebook.types.js';

export interface IFacebookService {
  isConfigured(): boolean;
  uploadImage(imagePath: string): Promise<string>;
  publishPost(caption: string, photoId: string): Promise<FacebookPublishResult>;
  publishPhotoPost(caption: string, imagePath: string): Promise<FacebookPublishResult>;
}
