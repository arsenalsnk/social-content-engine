import axios from 'axios';

import type { Article } from '../../../domain/entities/article.entity.js';
import type { IStockImageService } from '../../../domain/services/stock-image.service.interface.js';
import {
  extractImagesFromHtml,
  extractOgImageFromHtml,
  isLikelyPersonPhoto,
  normalizeImageUrl,
  pickBestArticleImage,
} from '../../../shared/utils/article-image.util.js';

export type ArticleImageSource =
  | 'existing'
  | 'content'
  | 'og-image'
  | 'wikimedia'
  | 'pexels'
  | 'none';

export interface ResolvedArticleImage {
  imageUrl: string;
  source: ArticleImageSource;
  query?: string;
}

export interface ResolveArticleImageOptions {
  mainPerson?: string;
}

export class ArticleImageEnrichmentService {
  constructor(
    private readonly useNewsImages: boolean,
    private readonly stockImageService: IStockImageService,
  ) {}

  async resolve(
    article: Article,
    options: ResolveArticleImageOptions = {},
  ): Promise<ResolvedArticleImage> {
    if (!this.useNewsImages) {
      return this.resolveStockImage(options.mainPerson);
    }

    return this.resolveNewsImage(article);
  }

  private async resolveStockImage(
    mainPerson?: string,
  ): Promise<ResolvedArticleImage> {
    const stockImage = await this.stockImageService.findImage(mainPerson);
    if (!stockImage) {
      return { imageUrl: '', source: 'none' };
    }

    return {
      imageUrl: stockImage.imageUrl,
      source: stockImage.source,
      query: stockImage.query,
    };
  }

  private async resolveNewsImage(article: Article): Promise<ResolvedArticleImage> {
    const existing = normalizeImageUrl(article.imageUrl);
    if (existing && isLikelyPersonPhoto(existing)) {
      return { imageUrl: existing, source: 'existing' };
    }

    const fromContent = pickBestArticleImage([
      ...extractImagesFromHtml(article.content),
      existing,
    ]);
    if (fromContent && isLikelyPersonPhoto(fromContent)) {
      return { imageUrl: fromContent, source: 'content' };
    }

    const fromOg = await this.fetchOgImage(article.url);
    if (fromOg && isLikelyPersonPhoto(fromOg)) {
      return { imageUrl: fromOg, source: 'og-image' };
    }

    if (fromContent) {
      return { imageUrl: fromContent, source: 'content' };
    }

    if (fromOg) {
      return { imageUrl: fromOg, source: 'og-image' };
    }

    if (existing) {
      return { imageUrl: existing, source: 'existing' };
    }

    return { imageUrl: '', source: 'none' };
  }

  private async fetchOgImage(articleUrl: string): Promise<string> {
    if (!articleUrl.trim()) {
      return '';
    }

    try {
      const response = await axios.get<string>(articleUrl, {
        timeout: 12000,
        maxRedirects: 5,
        responseType: 'text',
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
      });

      return extractOgImageFromHtml(response.data);
    } catch {
      return '';
    }
  }
}
