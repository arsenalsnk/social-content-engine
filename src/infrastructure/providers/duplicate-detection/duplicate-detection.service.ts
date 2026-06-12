import type { IArticleRepository } from '../../../domain/repositories/article.repository.interface.js';
import type { IDuplicateDetectionService } from '../../../domain/services/duplicate-detection.service.interface.js';

const TITLE_SIMILARITY_THRESHOLD = 0.75;

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/\s+/g, ' ').trim();
}

function titleSimilarity(a: string, b: string): number {
  const wordsA = new Set(normalizeTitle(a).split(' ').filter(Boolean));
  const wordsB = new Set(normalizeTitle(b).split(' ').filter(Boolean));

  if (wordsA.size === 0 || wordsB.size === 0) {
    return 0;
  }

  const intersection = [...wordsA].filter((word) => wordsB.has(word)).length;
  const union = new Set([...wordsA, ...wordsB]).size;

  return intersection / union;
}

export class DuplicateDetectionService implements IDuplicateDetectionService {
  constructor(private readonly articleRepository: IArticleRepository) {}

  async isDuplicate(url: string, title: string): Promise<boolean> {
    const byUrl = await this.articleRepository.findByUrl(url);
    if (byUrl) {
      return true;
    }

    const byTitle = await this.articleRepository.findByTitle(title);
    if (byTitle.length > 0) {
      return true;
    }

    const unposted = await this.articleRepository.findUnposted();
    return unposted.some(
      (article) => titleSimilarity(title, article.title) >= TITLE_SIMILARITY_THRESHOLD,
    );
  }
}
