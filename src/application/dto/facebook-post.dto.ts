import type { FacebookPostType } from '../../shared/enums/facebook-post-type.enum.js';

export interface FacebookPostDto {
  caption: string;
  imagePath: string;
  postType?: FacebookPostType;
}

export interface FacebookPostResultDto {
  facebookPostId: string;
  photoId: string;
}
