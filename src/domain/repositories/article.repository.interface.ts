import type {
  Article,
  CreateArticleInput,
  UpdateArticleInput,
} from '../entities/article.entity.js';

export interface IArticleRepository {
  findById(id: string): Promise<Article | null>;
  findByUrl(url: string): Promise<Article | null>;
  findByTitle(title: string): Promise<Article[]>;
  findUnposted(): Promise<Article[]>;
  create(input: CreateArticleInput): Promise<Article>;
  update(id: string, input: UpdateArticleInput): Promise<Article>;
  markAsPosted(id: string): Promise<void>;
}
