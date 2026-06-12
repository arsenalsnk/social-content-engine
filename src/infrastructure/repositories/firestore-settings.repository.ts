import type { FacebookSettings } from '../../domain/entities/settings.entity.js';
import type { ISettingsRepository } from '../../domain/repositories/settings.repository.interface.js';
import { FIRESTORE_COLLECTIONS } from '../../shared/constants/firestore.constants.js';
import { RepositoryError } from '../../shared/errors/repository.error.js';
import type { FirestoreClient } from '../database/firestore/firestore.client.js';
import { mapSettingsDoc } from '../database/firestore/firestore.mapper.js';

const SETTINGS_DOC_ID = 'facebook';

export class FirestoreSettingsRepository implements ISettingsRepository {
  private readonly collection;

  constructor(private readonly firestoreClient: FirestoreClient) {
    this.collection = this.firestoreClient
      .getDb()
      .collection(FIRESTORE_COLLECTIONS.SETTINGS);
  }

  async getFacebookSettings(): Promise<FacebookSettings | null> {
    const snapshot = await this.collection.doc(SETTINGS_DOC_ID).get();
    if (!snapshot.exists) {
      return null;
    }

    return mapSettingsDoc(snapshot.data()!);
  }

  async saveFacebookSettings(settings: FacebookSettings): Promise<FacebookSettings> {
    try {
      await this.collection.doc(SETTINGS_DOC_ID).set(settings);
      return settings;
    } catch (error) {
      throw new RepositoryError('Failed to save Facebook settings', error);
    }
  }
}
