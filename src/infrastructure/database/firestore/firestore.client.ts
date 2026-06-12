import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import admin from 'firebase-admin';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

import type { FirebaseConfig } from '../../../config/env.js';

let initialized = false;

function loadServiceAccount(credentialsPath: string): admin.ServiceAccount {
  const credentialsFile = resolve(credentialsPath);
  return JSON.parse(readFileSync(credentialsFile, 'utf-8')) as admin.ServiceAccount;
}

function initializeFirebase(config: FirebaseConfig): void {
  if (initialized) {
    return;
  }

  if (config.credentialsPath) {
    admin.initializeApp({
      credential: admin.cert(loadServiceAccount(config.credentialsPath)),
      projectId: config.projectId,
    });
  } else if (config.clientEmail && config.privateKey) {
    admin.initializeApp({
      credential: admin.cert({
        projectId: config.projectId,
        clientEmail: config.clientEmail,
        privateKey: config.privateKey,
      }),
      projectId: config.projectId,
    });
  } else {
    throw new Error('Firebase Admin SDK credentials are not configured');
  }

  initialized = true;
}

export class FirestoreClient {
  private readonly db: Firestore;

  constructor(config: FirebaseConfig) {
    initializeFirebase(config);
    this.db = getFirestore();
  }

  getDb(): Firestore {
    return this.db;
  }
}
