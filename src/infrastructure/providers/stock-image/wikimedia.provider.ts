import axios from 'axios';

const wikimediaApiUrl = 'https://commons.wikimedia.org/w/api.php';
const wikimediaUserAgent =
  'social-content-engine/1.0 (Arsenal fan page bot; +https://github.com/arsenalsnk/social-content-engine)';

interface WikimediaImageInfo {
  thumburl?: string;
  url?: string;
  width?: number;
  height?: number;
}

interface WikimediaPage {
  imageinfo?: WikimediaImageInfo[];
}

interface WikimediaQueryResponse {
  query?: {
    pages?: Record<string, WikimediaPage>;
  };
}

export class WikimediaProvider {
  async searchImage(query: string): Promise<string | null> {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return null;
    }

    try {
      const response = await axios.get<WikimediaQueryResponse>(wikimediaApiUrl, {
        params: {
          action: 'query',
          format: 'json',
          generator: 'search',
          gsrsearch: `filetype:bitmap ${trimmedQuery}`,
          gsrnamespace: 6,
          gsrlimit: 8,
          prop: 'imageinfo',
          iiprop: 'url|size',
          iiurlwidth: 1200,
        },
        timeout: 12000,
        headers: {
          'User-Agent': wikimediaUserAgent,
        },
      });

      const pages = response.data.query?.pages ?? {};
      const candidates: Array<{ imageUrl: string; score: number }> = [];

      for (const page of Object.values(pages)) {
        const imageInfo = page.imageinfo?.[0];
        if (!imageInfo) {
          continue;
        }

        const imageUrl = imageInfo.thumburl ?? imageInfo.url;
        if (!imageUrl) {
          continue;
        }

        const width = imageInfo.width ?? 0;
        const height = imageInfo.height ?? 0;
        let score = 1;

        if (width > 0 && height > 0) {
          const aspect = width / height;
          if (aspect > 2.2) {
            continue;
          }
          if (aspect <= 1.2) {
            score += 2;
          } else if (aspect <= 1.6) {
            score += 1;
          }
        }

        candidates.push({ imageUrl, score });
      }

      candidates.sort((left, right) => right.score - left.score);
      if (candidates[0]) {
        return candidates[0].imageUrl;
      }

      return null;
    } catch {
      return null;
    }
  }
}
