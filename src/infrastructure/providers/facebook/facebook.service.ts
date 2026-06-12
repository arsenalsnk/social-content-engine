import axios, { isAxiosError } from 'axios';

import type { IFacebookService } from '../../../domain/services/facebook.service.interface.js';
import { ProviderError } from '../../../shared/errors/provider.error.js';
import type { FacebookPublishResult } from '../../../shared/types/facebook.types.js';
import { resolvePageAccessToken } from './facebook-token.resolver.js';

interface FacebookPhotoResponse {
  id: string;
  post_id?: string;
}

interface FacebookGraphError {
  error?: {
    message?: string;
    code?: number;
    type?: string;
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

export class FacebookService implements IFacebookService {
  private readonly graphBaseUrl = 'https://graph.facebook.com/v21.0';
  private pageAccessToken: string | null = null;

  constructor(
    private readonly pageId: string,
    private readonly accessToken: string,
    private readonly retryAttempts = 3,
  ) {}

  isConfigured(): boolean {
    return Boolean(this.pageId && this.accessToken);
  }

  async uploadImage(imagePath: string): Promise<string> {
    return this.withRetry('upload image', async () => {
      const token = await this.getPageAccessToken();
      const formData = new FormData();
      const fileBuffer = await this.readFileAsBlob(imagePath);
      formData.append('source', fileBuffer, imagePath.split(/[/\\]/).pop() ?? 'image.png');
      formData.append('published', 'false');
      formData.append('access_token', token);

      const response = await axios.post<FacebookPhotoResponse>(
        `${this.graphBaseUrl}/${this.pageId}/photos`,
        formData,
      );

      if (!response.data.id) {
        throw new Error('Facebook did not return a photo ID');
      }

      return response.data.id;
    });
  }

  async publishPost(caption: string, photoId: string): Promise<FacebookPublishResult> {
    return this.withRetry('publish post', async () => {
      const token = await this.getPageAccessToken();
      const response = await axios.post<FacebookPhotoResponse>(
        `${this.graphBaseUrl}/${this.pageId}/photos`,
        null,
        {
          params: {
            caption,
            attached_media: JSON.stringify([{ media_fbid: photoId }]),
            access_token: token,
          },
        },
      );

      if (!response.data.id) {
        throw new Error('Facebook did not return a post ID');
      }

      return {
        photoId: response.data.id,
        facebookPostId: response.data.post_id ?? response.data.id,
      };
    });
  }

  async publishPhotoPost(caption: string, imagePath: string): Promise<FacebookPublishResult> {
    return this.withRetry('publish photo post', async () => {
      const token = await this.getPageAccessToken();
      const formData = new FormData();
      const fileBuffer = await this.readFileAsBlob(imagePath);
      formData.append('source', fileBuffer, imagePath.split(/[/\\]/).pop() ?? 'image.png');
      formData.append('message', caption);
      formData.append('access_token', token);

      const response = await axios.post<FacebookPhotoResponse>(
        `${this.graphBaseUrl}/${this.pageId}/photos`,
        formData,
      );

      if (!response.data.id) {
        throw new Error('Facebook did not return a photo post ID');
      }

      return {
        photoId: response.data.id,
        facebookPostId: response.data.post_id ?? response.data.id,
      };
    });
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

  private async withRetry<T>(
    action: string,
    fn: () => Promise<T>,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= this.retryAttempts; attempt += 1) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        if (attempt === this.retryAttempts) {
          break;
        }
      }
    }

    throw new ProviderError(
      `Failed to ${action} after ${this.retryAttempts} attempts: ${extractGraphError(lastError)}`,
      'facebook',
      lastError,
    );
  }

  private async readFileAsBlob(imagePath: string): Promise<Blob> {
    const { readFile } = await import('node:fs/promises');
    const buffer = await readFile(imagePath);
    return new Blob([buffer]);
  }
}
