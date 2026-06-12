import type { RssFeedItem, RssSource } from '../entities/rss-source.entity.js';

export interface IRssService {
  fetchFeed(source: RssSource): Promise<RssFeedItem[]>;
  fetchAllFeeds(sources: RssSource[]): Promise<RssFeedItem[]>;
}
