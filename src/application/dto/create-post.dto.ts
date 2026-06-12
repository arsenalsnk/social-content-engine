import type { PostStatus } from '../../shared/enums/post-status.enum.js';

export interface CreatePostDto {
  articleId: string;
  caption: string;
  imagePath: string;
  status?: PostStatus;
}
