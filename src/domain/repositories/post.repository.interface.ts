import type { CreatePostInput, Post } from '../entities/post.entity.js';

export interface IPostRepository {
  findById(id: string): Promise<Post | null>;
  findByArticleId(articleId: string): Promise<Post | null>;
  create(input: CreatePostInput): Promise<Post>;
}
