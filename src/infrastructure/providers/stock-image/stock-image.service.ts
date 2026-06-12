import type {
  IStockImageService,
  StockImageResult,
} from '../../../domain/services/stock-image.service.interface.js';
import { DEFAULT_PEXELS_QUERY } from '../../../shared/constants/stock-image.constants.js';
import { PexelsProvider } from './pexels.provider.js';
import { WikimediaProvider } from './wikimedia.provider.js';

export class StockImageService implements IStockImageService {
  private readonly wikimediaProvider = new WikimediaProvider();

  constructor(
    private readonly pexelsProvider: PexelsProvider,
    private readonly defaultPexelsQuery = DEFAULT_PEXELS_QUERY,
  ) {}

  async findImage(mainPerson?: string): Promise<StockImageResult | null> {
    const person = mainPerson?.trim();

    if (person) {
      const wikimediaQueries = [
        `${person} Arsenal`,
        `${person} football`,
        person,
      ];

      for (const query of wikimediaQueries) {
        const imageUrl = await this.wikimediaProvider.searchImage(query);
        if (imageUrl) {
          return { imageUrl, source: 'wikimedia', query };
        }
      }

      if (this.pexelsProvider.isConfigured()) {
        const pexelsPersonUrl = await this.pexelsProvider.searchImage(
          `${person} football`,
        );
        if (pexelsPersonUrl) {
          return {
            imageUrl: pexelsPersonUrl,
            source: 'pexels',
            query: `${person} football`,
          };
        }
      }
    }

    if (this.pexelsProvider.isConfigured()) {
      const fallbackQueries = [
        'Arsenal FC football',
        this.defaultPexelsQuery,
        'football stadium',
      ];

      for (const query of fallbackQueries) {
        const imageUrl = await this.pexelsProvider.searchImage(query);
        if (imageUrl) {
          return { imageUrl, source: 'pexels', query };
        }
      }
    }

    const wikimediaFallback = await this.wikimediaProvider.searchImage(
      'Arsenal F.C. Emirates Stadium',
    );
    if (wikimediaFallback) {
      return {
        imageUrl: wikimediaFallback,
        source: 'wikimedia',
        query: 'Arsenal F.C. Emirates Stadium',
      };
    }

    return null;
  }
}
