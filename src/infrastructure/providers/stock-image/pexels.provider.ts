import axios from 'axios';

interface PexelsPhotoSrc {
  large2x?: string;
  large?: string;
  original?: string;
}

interface PexelsPhoto {
  src?: PexelsPhotoSrc;
}

interface PexelsSearchResponse {
  photos?: PexelsPhoto[];
}

export class PexelsProvider {
  constructor(private readonly apiKey: string) {}

  isConfigured(): boolean {
    return Boolean(this.apiKey.trim());
  }

  async searchImage(query: string): Promise<string | null> {
    if (!this.isConfigured()) {
      return null;
    }

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      return null;
    }

    try {
      const response = await axios.get<PexelsSearchResponse>(
        'https://api.pexels.com/v1/search',
        {
          params: {
            query: trimmedQuery,
            per_page: 1,
            orientation: 'portrait',
          },
          headers: {
            Authorization: this.apiKey,
          },
          timeout: 12000,
        },
      );

      const photo = response.data.photos?.[0];
      return photo?.src?.large2x ?? photo?.src?.large ?? photo?.src?.original ?? null;
    } catch {
      return null;
    }
  }
}
