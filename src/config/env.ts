import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import type { RssSource } from '../domain/entities/rss-source.entity.js';
import type { ArticleDateFilterMode } from '../shared/utils/article-date.util.js';
import {
  DEFAULT_CRON_SCHEDULE,
  DEFAULT_IMAGE_OUTPUT_DIR,
  DEFAULT_INSTAGRAM_FETCH_LIMIT,
  DEFAULT_INSTAGRAM_KEYWORDS,
  DEFAULT_INSTAGRAM_TARGET_USERNAME,
  DEFAULT_PEXELS_QUERY,
  DEFAULT_USE_NEWS_IMAGES,
} from '../shared/constants/index.js';

export interface FirebaseConfig {
  projectId: string;
  credentialsPath?: string;
  clientEmail?: string;
  privateKey?: string;
}

export interface FacebookConfig {
  pageId: string;
  accessToken: string;
}

export interface InstagramConfig {
  enabled: boolean;
  targetUsername: string;
  fetchLimit: number;
  keywords: string[];
  sourceName: string;
}

export interface StockImageConfig {
  useNewsImages: boolean;
  pexelsApiKey: string;
  defaultPexelsQuery: string;
}

export type LlmProviderId = 'deepseek' | 'gemini' | 'openai';

export interface LlmConfig {
  providerOrder: LlmProviderId[];
  deepseek: {
    apiKey?: string;
    model: string;
    baseUrl: string;
  };
  gemini: {
    apiKey?: string;
    model: string;
  };
  openai: {
    apiKey?: string;
    model: string;
    baseUrl: string;
  };
}

const LLM_PROVIDER_IDS: LlmProviderId[] = ['deepseek', 'gemini', 'openai'];

export interface ArticleFilterConfig {
  mode: ArticleDateFilterMode;
  timezone: string;
  maxAgeHours: number;
}

export interface EnvConfig {
  nodeEnv: 'development' | 'production' | 'test';
  cronSchedule: string;
  llm: LlmConfig;
  pipelineBatchSize: number;
  articleFilter: ArticleFilterConfig;
  firebase: FirebaseConfig;
  facebook: FacebookConfig;
  instagram: InstagramConfig;
  rssSources: RssSource[];
  imageOutputDir: string;
  stockImage: StockImageConfig;
  facebookRetryAttempts: number;
  logLevel: 'INFO' | 'WARN' | 'ERROR';
}

interface ServiceAccountFile {
  project_id?: string;
  client_email?: string;
  private_key?: string;
}

function requireEnv(key: string): string {
  const value = process.env[key]?.trim();
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

function optionalEnv(key: string): string | undefined {
  const value = process.env[key]?.trim();
  return value || undefined;
}

function parseBoolean(raw: string | undefined, defaultValue: boolean): boolean {
  if (raw === undefined) {
    return defaultValue;
  }

  const normalized = raw.trim().toLowerCase();
  if (['true', '1', 'yes'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no'].includes(normalized)) {
    return false;
  }

  return defaultValue;
}

function parseKeywordList(raw: string | undefined): string[] {
  if (!raw?.trim()) {
    return [...DEFAULT_INSTAGRAM_KEYWORDS];
  }

  return raw
    .split(',')
    .map((keyword) => keyword.trim())
    .filter(Boolean);
}

function parseArticleFilterMode(raw: string | undefined): ArticleDateFilterMode {
  const mode = (raw?.trim().toLowerCase() ?? 'today') as ArticleDateFilterMode;
  if (mode !== 'today' && mode !== 'hours') {
    throw new Error('ARTICLE_FILTER_MODE must be "today" or "hours"');
  }
  return mode;
}

function parseLlmProviders(raw: string | undefined): LlmProviderId[] {
  const source = raw?.trim() || 'deepseek,gemini';
  const ids = source
    .split(',')
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  if (ids.length === 0) {
    throw new Error('LLM_PROVIDERS must list at least one provider');
  }

  for (const id of ids) {
    if (!LLM_PROVIDER_IDS.includes(id as LlmProviderId)) {
      throw new Error(
        `Invalid LLM provider "${id}". Supported: ${LLM_PROVIDER_IDS.join(', ')}`,
      );
    }
  }

  return ids as LlmProviderId[];
}

function resolveLlmConfig(): LlmConfig {
  const providerOrder = parseLlmProviders(optionalEnv('LLM_PROVIDERS'));
  const deepseekApiKey = optionalEnv('DEEPSEEK_API_KEY');
  const geminiApiKey = optionalEnv('GEMINI_API_KEY');
  const openaiApiKey = optionalEnv('OPENAI_API_KEY');
  const llm: LlmConfig = {
    providerOrder,
    deepseek: {
      ...(deepseekApiKey ? { apiKey: deepseekApiKey } : {}),
      model: optionalEnv('DEEPSEEK_MODEL') ?? 'deepseek-chat',
      baseUrl: optionalEnv('DEEPSEEK_BASE_URL') ?? 'https://api.deepseek.com',
    },
    gemini: {
      ...(geminiApiKey ? { apiKey: geminiApiKey } : {}),
      model: optionalEnv('GEMINI_MODEL') ?? 'gemini-2.5-flash',
    },
    openai: {
      ...(openaiApiKey ? { apiKey: openaiApiKey } : {}),
      model: optionalEnv('OPENAI_MODEL') ?? 'gpt-4o-mini',
      baseUrl: optionalEnv('OPENAI_BASE_URL') ?? 'https://api.openai.com/v1',
    },
  };

  const hasConfiguredProvider = providerOrder.some((providerId) => {
    switch (providerId) {
      case 'deepseek':
        return Boolean(llm.deepseek.apiKey);
      case 'gemini':
        return Boolean(llm.gemini.apiKey);
      case 'openai':
        return Boolean(llm.openai.apiKey);
      default:
        return false;
    }
  });

  if (!hasConfiguredProvider) {
    throw new Error(
      'At least one LLM API key is required. Set DEEPSEEK_API_KEY, GEMINI_API_KEY, or OPENAI_API_KEY.',
    );
  }

  return llm;
}

function parseRssSources(raw: string): RssSource[] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('RSS_SOURCES must be valid JSON');
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('RSS_SOURCES must be a non-empty JSON array');
  }

  return parsed as RssSource[];
}

function readServiceAccountFile(credentialsPath: string): ServiceAccountFile {
  const credentialsFile = resolve(credentialsPath);

  if (!existsSync(credentialsFile)) {
    throw new Error(
      `Service account file not found: ${credentialsFile}\n` +
        'Download from Firebase Console → Project Settings → Service accounts → Generate new private key',
    );
  }

  try {
    return JSON.parse(readFileSync(credentialsFile, 'utf-8')) as ServiceAccountFile;
  } catch {
    throw new Error(`Invalid service account JSON: ${credentialsFile}`);
  }
}

function resolveFirebaseConfig(): FirebaseConfig {
  const credentialsPath = optionalEnv('GOOGLE_APPLICATION_CREDENTIALS');
  const clientEmail = optionalEnv('FIREBASE_CLIENT_EMAIL');
  const privateKey = optionalEnv('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');
  let projectId = optionalEnv('FIREBASE_PROJECT_ID');

  if (credentialsPath) {
    const serviceAccount = readServiceAccountFile(credentialsPath);

    if (!projectId && serviceAccount.project_id) {
      projectId = serviceAccount.project_id;
    }

    if (!projectId) {
      throw new Error(
        'FIREBASE_PROJECT_ID is required when it cannot be read from the service account file',
      );
    }

    return { projectId, credentialsPath };
  }

  if (clientEmail && privateKey) {
    return {
      projectId: projectId ?? requireEnv('FIREBASE_PROJECT_ID'),
      clientEmail,
      privateKey,
    };
  }

  throw new Error(
    'Firebase Admin SDK credentials required.\n' +
      'Option 1: GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json\n' +
      'Option 2: FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY\n' +
      'Note: Web SDK config (apiKey, appId) is NOT used by this backend.',
  );
}

export function loadEnvConfig(): EnvConfig {
  const nodeEnv = (process.env.NODE_ENV ?? 'development') as EnvConfig['nodeEnv'];
  const instagramTargetUsername =
    optionalEnv('INSTAGRAM_TARGET_USERNAME') ?? DEFAULT_INSTAGRAM_TARGET_USERNAME;

  return {
    nodeEnv,
    cronSchedule: process.env.CRON_SCHEDULE?.trim() ?? DEFAULT_CRON_SCHEDULE,
    llm: resolveLlmConfig(),
    pipelineBatchSize: Number(process.env.PIPELINE_BATCH_SIZE ?? '1'),
    articleFilter: {
      mode: parseArticleFilterMode(optionalEnv('ARTICLE_FILTER_MODE')),
      timezone: optionalEnv('ARTICLE_TIMEZONE') ?? 'Asia/Bangkok',
      maxAgeHours: Number(process.env.MAX_ARTICLE_AGE_HOURS ?? '48'),
    },
    firebase: resolveFirebaseConfig(),
    facebook: {
      pageId: optionalEnv('FACEBOOK_PAGE_ID') ?? '',
      accessToken: optionalEnv('FACEBOOK_ACCESS_TOKEN') ?? '',
    },
    instagram: {
      enabled: parseBoolean(optionalEnv('INSTAGRAM_ENABLED'), true),
      targetUsername: instagramTargetUsername,
      fetchLimit: Number(
        optionalEnv('INSTAGRAM_FETCH_LIMIT') ?? String(DEFAULT_INSTAGRAM_FETCH_LIMIT),
      ),
      keywords: parseKeywordList(optionalEnv('INSTAGRAM_KEYWORDS')),
      sourceName:
        optionalEnv('INSTAGRAM_SOURCE_NAME') ??
        `Instagram @${instagramTargetUsername}`,
    },
    rssSources: parseRssSources(requireEnv('RSS_SOURCES')),
    imageOutputDir: process.env.IMAGE_OUTPUT_DIR?.trim() ?? DEFAULT_IMAGE_OUTPUT_DIR,
    stockImage: {
      useNewsImages: parseBoolean(
        optionalEnv('USE_NEWS_IMAGES'),
        DEFAULT_USE_NEWS_IMAGES,
      ),
      pexelsApiKey: optionalEnv('PEXELS_API_KEY') ?? '',
      defaultPexelsQuery:
        optionalEnv('PEXELS_DEFAULT_QUERY') ?? DEFAULT_PEXELS_QUERY,
    },
    facebookRetryAttempts: Number(process.env.FACEBOOK_RETRY_ATTEMPTS ?? '3'),
    logLevel: (process.env.LOG_LEVEL?.trim() ?? 'INFO') as EnvConfig['logLevel'],
  };
}
