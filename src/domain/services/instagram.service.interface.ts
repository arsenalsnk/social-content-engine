import type { InstagramPost } from '../entities/instagram-post.entity.js';

export interface IInstagramService {
  isConfigured(): boolean;
  fetchRecentPosts(): Promise<InstagramPost[]>;
}
