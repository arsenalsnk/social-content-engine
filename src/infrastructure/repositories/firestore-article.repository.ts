import type {
  Article,
  CreateArticleInput,
  UpdateArticleInput,
} from '../../domain/entities/article.entity.js';
import type { IArticleRepository } from '../../domain/repositories/article.repository.interface.js';
import { FIRESTORE_COLLECTIONS } from '../../shared/constants/firestore.constants.js';
import { sortByPublishedAtDesc } from '../../shared/utils/article-date.util.js';
import { RepositoryError } from '../../shared/errors/repository.error.js';
import type { FirestoreClient } from '../database/firestore/firestore.client.js';
import { mapArticleDoc, toTimestamp } from '../database/firestore/firestore.mapper.js';

export class FirestoreArticleRepository implements IArticleRepository {
  private readonly collection;

  constructor(private readonly firestoreClient: FirestoreClient) {
    this.collection = this.firestoreClient
      .getDb()
      .collection(FIRESTORE_COLLECTIONS.ARTICLES);
  }

  async findById(id: string): Promise<Article | null> {
    const snapshot = await this.collection.doc(id).get();
    if (!snapshot.exists) {
      return null;
    }

    return mapArticleDoc(snapshot.id, snapshot.data()!);
  }

  async findByUrl(url: string): Promise<Article | null> {
    const snapshot = await this.collection.where('url', '==', url).limit(1).get();
    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0]!;
    return mapArticleDoc(doc.id, doc.data());
  }

  async findByTitle(title: string): Promise<Article[]> {
    const snapshot = await this.collection.where('title', '==', title).get();
    return snapshot.docs.map((doc) => mapArticleDoc(doc.id, doc.data()));
  }

  async findUnposted(): Promise<Article[]> {
    const snapshot = await this.collection.where('posted', '==', false).get();
    const articles = snapshot.docs.map((doc) => mapArticleDoc(doc.id, doc.data()));
    return sortByPublishedAtDesc(articles);
  }

  async create(input: CreateArticleInput): Promise<Article> {
    try {
      const now = input.createdAt ?? new Date();
      const docRef = input.id
        ? this.collection.doc(input.id)
        : this.collection.doc();

      const data = {
        source: input.source,
        title: input.title,
        url: input.url,
        content: input.content,
        summary: input.summary,
        caption: input.caption ?? '',
        imageUrl: input.imageUrl,
        mainPerson: input.mainPerson ?? '',
        publishedAt: toTimestamp(input.publishedAt),
        posted: input.posted,
        createdAt: toTimestamp(now),
      };

      await docRef.set(data);

      return mapArticleDoc(docRef.id, data);
    } catch (error) {
      throw new RepositoryError('Failed to create article', error);
    }
  }

  async update(id: string, input: UpdateArticleInput): Promise<Article> {
    try {
      const docRef = this.collection.doc(id);
      const snapshot = await docRef.get();

      if (!snapshot.exists) {
        throw new RepositoryError(`Article not found: ${id}`);
      }

      await docRef.update(input);
      const updated = await docRef.get();
      return mapArticleDoc(updated.id, updated.data()!);
    } catch (error) {
      throw new RepositoryError(`Failed to update article: ${id}`, error);
    }
  }

  async markAsPosted(id: string): Promise<void> {
    try {
      await this.collection.doc(id).update({ posted: true });
    } catch (error) {
      throw new RepositoryError(`Failed to mark article as posted: ${id}`, error);
    }
  }
}
