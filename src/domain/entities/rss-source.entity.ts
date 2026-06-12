export type RssSourceCategory =
  | 'official'
  | 'transfer'
  | 'football'
  | 'general';

export interface RssSource {
  id: string;
  name: string;
  url: string;
  category: RssSourceCategory;
  enabled: boolean;
}

export interface RssFeedItem {
  source: string;
  title: string;
  url: string;
  content: string;
  imageUrl: string;
  publishedAt: Date;
}
