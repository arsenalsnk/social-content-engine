import 'dotenv/config';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

import axios from 'axios';

import { resolvePageAccessToken } from '../infrastructure/providers/facebook/facebook-token.resolver.js';

const pageId = process.env.FACEBOOK_PAGE_ID?.trim();
const accessToken = process.env.FACEBOOK_ACCESS_TOKEN?.trim();
const shouldPost = process.argv.includes('--post');
const graphBaseUrl = 'https://graph.facebook.com/v21.0';

function extractGraphError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { error?: { message?: string; type?: string; code?: number } };
    if (data?.error?.message) {
      return `${data.error.message} (code: ${data.error.code ?? 'unknown'})`;
    }
    return error.message;
  }

  return error instanceof Error ? error.message : String(error);
}

async function getLatestImage(): Promise<string | null> {
  const outputDir = process.env.IMAGE_OUTPUT_DIR?.trim() ?? './output/images';

  try {
    const files = (await readdir(outputDir)).filter((file) => file.endsWith('.png'));
    if (files.length === 0) {
      return null;
    }

    return join(outputDir, files.sort().at(-1)!);
  } catch {
    return null;
  }
}

async function verifyPage(token: string): Promise<void> {
  const response = await axios.get(`${graphBaseUrl}/${pageId}`, {
    params: {
      fields: 'id,name,link',
      access_token: token,
    },
  });

  console.log('Page verified:', response.data);
}

async function verifyToken(token: string, label: string): Promise<void> {
  const response = await axios.get(`${graphBaseUrl}/debug_token`, {
    params: {
      input_token: token,
      access_token: token,
    },
  });

  const data = response.data.data as {
    is_valid?: boolean;
    type?: string;
    app_id?: string;
    expires_at?: number;
    scopes?: string[];
  };

  console.log(`${label} token info:`, {
    valid: data.is_valid,
    type: data.type,
    appId: data.app_id,
    expiresAt: data.expires_at === 0 ? 'never' : data.expires_at,
    scopes: data.scopes,
  });
}

async function testPhotoPost(imagePath: string, pageToken: string): Promise<void> {
  const buffer = await readFile(imagePath);
  const formData = new FormData();
  formData.append('source', new Blob([buffer]), imagePath.split(/[/\\]/).pop() ?? 'test.png');
  formData.append(
    'message',
    '🔴 ทดสอบโพสต์จาก social-content-engine\n\nระบบทำงานปกติแล้วครับ! 👇',
  );
  formData.append('access_token', pageToken);
  formData.append('published', 'true');

  const response = await axios.post(`${graphBaseUrl}/${pageId}/photos`, formData);
  console.log('Test post published:', response.data);
}

async function main(): Promise<void> {
  if (!pageId || !accessToken) {
    throw new Error(
      'Set FACEBOOK_PAGE_ID and FACEBOOK_ACCESS_TOKEN in .env before testing',
    );
  }

  console.log('Testing Facebook Graph API...');
  await verifyToken(accessToken, 'Input');
  await verifyPage(accessToken);

  const pageToken = await resolvePageAccessToken(accessToken, pageId);
  await verifyToken(pageToken, 'Page');

  if (!shouldPost) {
    console.log('Connection OK. Run with --post to publish a test image.');
    return;
  }

  const imagePath = await getLatestImage();
  if (!imagePath) {
    throw new Error('No image found. Run pnpm run pipeline first.');
  }

  console.log('Publishing test post with image:', imagePath);
  await testPhotoPost(imagePath, pageToken);
}

main().catch((error: unknown) => {
  console.error('Facebook test failed:', extractGraphError(error));
  process.exit(1);
});
