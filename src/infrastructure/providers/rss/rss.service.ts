import Parser from 'rss-parser';

import type { RssFeedItem, RssSource } from '../../../domain/entities/rss-source.entity.js';
import type { IRssService } from '../../../domain/services/rss.service.interface.js';
import { ProviderError } from '../../../shared/errors/provider.error.js';
import { sortByPublishedAtDesc } from '../../../shared/utils/article-date.util.js';
import {
  extractImagesFromHtml,
  normalizeImageUrl,
  pickBestArticleImage,
} from '../../../shared/utils/article-image.util.js';

interface RssParserItem {
  title?: string;
  link?: string;
  content?: string;
  contentSnippet?: string;
  isoDate?: string;
  pubDate?: string;
  enclosure?: { url?: string; type?: string };
  ['media:content']?: { $?: { url?: string } };
  ['media:thumbnail']?: { $?: { url?: string } };
}

export class RssService implements IRssService {
  private readonly parser = new Parser<RssParserItem>({
    customFields: {
      item: [
        ['media:content', 'media:content'],
        ['media:thumbnail', 'media:thumbnail'],
      ],
    },
  });

  async fetchFeed(source: RssSource): Promise<RssFeedItem[]> {
    if (!source.enabled) {
      return [];
    }

    try {
      const feed = await this.parser.parseURL(source.url);

      return (feed.items ?? [])
        .filter((item) => item.link && item.title)
        .map((item) => ({
          source: source.name,
          title: item.title!.trim(),
          url: item.link!.trim(),
          content: (item.content ?? item.contentSnippet ?? '').trim(),
          imageUrl: this.extractImageUrl(item),
          publishedAt: this.parseDate(item),
        }));
    } catch (error) {
      throw new ProviderError(
        `Failed to fetch RSS feed: ${source.name}`,
        'rss',
        error,
      );
    }
  }

  async fetchAllFeeds(sources: RssSource[]): Promise<RssFeedItem[]> {
    const enabledSources = sources.filter((source) => source.enabled);
    const results = await Promise.allSettled(
      enabledSources.map((source) => this.fetchFeed(source)),
    );

    const items: RssFeedItem[] = [];

    for (const result of results) {
      if (result.status === 'fulfilled') {
        items.push(...result.value);
      }
    }

    return sortByPublishedAtDesc(items);
  }

  private extractImageUrl(item: RssParserItem): string {
    const candidates: string[] = [];
    const html = item.content ?? '';

    if (item.enclosure?.url && item.enclosure.type?.startsWith('image')) {
      candidates.push(item.enclosure.url);
    } else if (item.enclosure?.url && !item.enclosure.type?.includes('video')) {
      candidates.push(item.enclosure.url);
    }

    const mediaContent = item['media:content'];
    if (mediaContent?.$?.url) {
      candidates.push(mediaContent.$.url);
    }

    const mediaThumbnail = item['media:thumbnail'];
    if (mediaThumbnail?.$?.url) {
      candidates.push(mediaThumbnail.$.url);
    }

    candidates.push(...extractImagesFromHtml(html));

    return pickBestArticleImage(candidates.map(normalizeImageUrl));
  }

  private parseDate(item: RssParserItem): Date {
    const raw = item.isoDate ?? item.pubDate;
    if (!raw) {
      return new Date();
    }

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  }
}
