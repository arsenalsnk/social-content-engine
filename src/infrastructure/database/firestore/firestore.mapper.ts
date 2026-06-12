import { Timestamp, type DocumentData } from 'firebase-admin/firestore';

import type { Article } from '../../../domain/entities/article.entity.js';
import type { Post } from '../../../domain/entities/post.entity.js';
import type { FacebookSettings } from '../../../domain/entities/settings.entity.js';

function toDate(value: unknown): Date {
  if (value instanceof Timestamp) {
    return value.toDate();
  }

  if (value instanceof Date) {
    return value;
  }

  return new Date();
}

export function mapArticleDoc(id: string, data: DocumentData): Article {
  return {
    id,
    source: String(data.source ?? ''),
    title: String(data.title ?? ''),
    url: String(data.url ?? ''),
    content: String(data.content ?? ''),
    summary: String(data.summary ?? ''),
    caption: String(data.caption ?? ''),
    imageUrl: String(data.imageUrl ?? ''),
    mainPerson: String(data.mainPerson ?? ''),
    publishedAt: toDate(data.publishedAt),
    posted: Boolean(data.posted),
    createdAt: toDate(data.createdAt),
  };
}

export function mapPostDoc(id: string, data: DocumentData): Post {
  return {
    id,
    articleId: String(data.articleId ?? ''),
    facebookPostId: String(data.facebookPostId ?? ''),
    caption: String(data.caption ?? ''),
    imagePath: String(data.imagePath ?? ''),
    postedAt: toDate(data.postedAt),
  };
}

export function mapSettingsDoc(data: DocumentData): FacebookSettings {
  return {
    pageId: String(data.pageId ?? ''),
    accessToken: String(data.accessToken ?? ''),
  };
}

export function toTimestamp(date: Date): Timestamp {
  return Timestamp.fromDate(date);
}
