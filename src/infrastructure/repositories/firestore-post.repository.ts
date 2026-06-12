import type { CreatePostInput, Post } from '../../domain/entities/post.entity.js';
import type { IPostRepository } from '../../domain/repositories/post.repository.interface.js';
import { FIRESTORE_COLLECTIONS } from '../../shared/constants/firestore.constants.js';
import { RepositoryError } from '../../shared/errors/repository.error.js';
import type { FirestoreClient } from '../database/firestore/firestore.client.js';
import { mapPostDoc, toTimestamp } from '../database/firestore/firestore.mapper.js';

export class FirestorePostRepository implements IPostRepository {
  private readonly collection;

  constructor(private readonly firestoreClient: FirestoreClient) {
    this.collection = this.firestoreClient
      .getDb()
      .collection(FIRESTORE_COLLECTIONS.POSTS);
  }

  async findById(id: string): Promise<Post | null> {
    const snapshot = await this.collection.doc(id).get();
    if (!snapshot.exists) {
      return null;
    }

    return mapPostDoc(snapshot.id, snapshot.data()!);
  }

  async findByArticleId(articleId: string): Promise<Post | null> {
    const snapshot = await this.collection
      .where('articleId', '==', articleId)
      .limit(1)
      .get();

    if (snapshot.empty) {
      return null;
    }

    const doc = snapshot.docs[0]!;
    return mapPostDoc(doc.id, doc.data());
  }

  async create(input: CreatePostInput): Promise<Post> {
    try {
      const now = input.postedAt ?? new Date();
      const docRef = input.id ? this.collection.doc(input.id) : this.collection.doc();

      const data = {
        articleId: input.articleId,
        facebookPostId: input.facebookPostId,
        caption: input.caption,
        imagePath: input.imagePath,
        postedAt: toTimestamp(now),
      };

      await docRef.set(data);
      return mapPostDoc(docRef.id, data);
    } catch (error) {
      throw new RepositoryError('Failed to create post', error);
    }
  }
}
