import axios, { isAxiosError } from 'axios';

import type { InstagramPost } from '../../../domain/entities/instagram-post.entity.js';
import type { IInstagramService } from '../../../domain/services/instagram.service.interface.js';
import { ProviderError } from '../../../shared/errors/provider.error.js';
import { resolvePageAccessToken } from '../facebook/facebook-token.resolver.js';

const graphBaseUrl = 'https://graph.facebook.com/v21.0';

interface FacebookGraphError {
  error?: {
    message?: string;
    code?: number;
    type?: string;
  };
}

interface InstagramBusinessAccountResponse {
  instagram_business_account?: {
    id?: string;
  };
}

interface BusinessDiscoveryMedia {
  id?: string;
  caption?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink?: string;
  timestamp?: string;
  media_type?: string;
  children?: {
    data?: BusinessDiscoveryMedia[];
  };
}

interface BusinessDiscoveryResponse {
  business_discovery?: {
    username?: string;
    name?: string;
    media?: {
      data?: BusinessDiscoveryMedia[];
    };
  };
}

function extractGraphError(error: unknown): string {
  if (isAxiosError(error)) {
    const data = error.response?.data as FacebookGraphError | undefined;
    if (data?.error?.message) {
      return `${data.error.message} (code: ${data.error.code ?? 'unknown'})`;
    }
    return error.message;
  }

  return error instanceof Error ? error.message : String(error);
}

function extractMediaImageUrl(media: BusinessDiscoveryMedia): string {
  if (media.media_type === 'IMAGE' && media.media_url) {
    return media.media_url;
  }

  if (media.media_type === 'VIDEO' && media.thumbnail_url) {
    return media.thumbnail_url;
  }

  if (media.media_type === 'CAROUSEL_ALBUM') {
    const firstChild = media.children?.data?.[0];
    if (firstChild?.media_url) {
      return firstChild.media_url;
    }
    if (firstChild?.thumbnail_url) {
      return firstChild.thumbnail_url;
    }
  }

  return media.media_url ?? media.thumbnail_url ?? '';
}

function mapMediaToPost(
  media: BusinessDiscoveryMedia,
  username: string,
): InstagramPost | null {
  if (!media.id || !media.permalink || !media.timestamp) {
    return null;
  }

  return {
    id: media.id,
    username,
    caption: media.caption?.trim() ?? '',
    permalink: media.permalink,
    imageUrl: extractMediaImageUrl(media),
    publishedAt: new Date(media.timestamp),
    mediaType: media.media_type ?? 'UNKNOWN',
  };
}

export class InstagramService implements IInstagramService {
  private pageAccessToken: string | null = null;
  private instagramBusinessAccountId: string | null = null;

  constructor(
    private readonly pageId: string,
    private readonly accessToken: string,
    private readonly targetUsername: string,
    private readonly fetchLimit: number,
    private readonly enabled: boolean,
  ) {}

  isConfigured(): boolean {
    return (
      this.enabled &&
      Boolean(this.pageId && this.accessToken && this.targetUsername)
    );
  }

  async fetchRecentPosts(): Promise<InstagramPost[]> {
    if (!this.isConfigured()) {
      return [];
    }

    try {
      const token = await this.getPageAccessToken();
      const instagramAccountId = await this.getInstagramBusinessAccountId(token);
      const fields = [
        `business_discovery.username(${this.targetUsername})`,
        '{username,name,media.limit(',
        `${this.fetchLimit}){id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,`,
        'children{media_type,media_url,thumbnail_url}}}',
      ].join('');

      const response = await axios.get<BusinessDiscoveryResponse>(
        `${graphBaseUrl}/${instagramAccountId}`,
        {
          params: {
            fields,
            access_token: token,
          },
        },
      );

      const discovery = response.data.business_discovery;
      const username = discovery?.username ?? this.targetUsername;
      const mediaItems = discovery?.media?.data ?? [];

      return mediaItems
        .map((media) => mapMediaToPost(media, username))
        .filter((post): post is InstagramPost => post !== null);
    } catch (error) {
      throw new ProviderError(
        `Failed to fetch Instagram posts from @${this.targetUsername}: ${extractGraphError(error)}`,
        'instagram',
        error,
      );
    }
  }

  private async getPageAccessToken(): Promise<string> {
    if (this.pageAccessToken) {
      return this.pageAccessToken;
    }

    this.pageAccessToken = await resolvePageAccessToken(
      this.accessToken,
      this.pageId,
    );

    return this.pageAccessToken;
  }

  private async getInstagramBusinessAccountId(token: string): Promise<string> {
    if (this.instagramBusinessAccountId) {
      return this.instagramBusinessAccountId;
    }

    const response = await axios.get<InstagramBusinessAccountResponse>(
      `${graphBaseUrl}/${this.pageId}`,
      {
        params: {
          fields: 'instagram_business_account',
          access_token: token,
        },
      },
    );

    const accountId = response.data.instagram_business_account?.id;
    if (!accountId) {
      throw new Error(
        'No Instagram Business account linked to this Facebook Page. ' +
          'Open Meta Business Suite → Settings → Linked accounts → connect Instagram (Business/Creator) to Sakon Gunners. ' +
          'Then add instagram_basic and instagram_manage_insights to your access token.',
      );
    }

    this.instagramBusinessAccountId = accountId;
    return accountId;
  }
}
