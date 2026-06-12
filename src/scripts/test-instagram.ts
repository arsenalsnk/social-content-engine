import 'dotenv/config';

import axios from 'axios';

import { loadEnvConfig } from '../config/env.js';
import { InstagramService } from '../infrastructure/providers/instagram/instagram.service.js';
import { resolvePageAccessToken } from '../infrastructure/providers/facebook/facebook-token.resolver.js';
import {
  captionToTitle,
  matchesInstagramKeywords,
} from '../shared/utils/instagram-filter.util.js';

const graphBaseUrl = 'https://graph.facebook.com/v21.0';

function extractError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

async function main(): Promise<void> {
  const env = loadEnvConfig();

  if (!env.facebook.pageId || !env.facebook.accessToken) {
    throw new Error(
      'Set FACEBOOK_PAGE_ID and FACEBOOK_ACCESS_TOKEN in .env before testing Instagram',
    );
  }

  const instagramService = new InstagramService(
    env.facebook.pageId,
    env.facebook.accessToken,
    env.instagram.targetUsername,
    env.instagram.fetchLimit,
    true,
  );

  const pageToken = await resolvePageAccessToken(
    env.facebook.accessToken,
    env.facebook.pageId,
  );

  const debugResponse = await axios.get(`${graphBaseUrl}/debug_token`, {
    params: {
      input_token: env.facebook.accessToken,
      access_token: env.facebook.accessToken,
    },
  });
  const scopes = (debugResponse.data.data?.scopes as string[] | undefined) ?? [];
  const missingInstagramScopes = ['instagram_basic', 'instagram_manage_insights'].filter(
    (scope) => !scopes.includes(scope),
  );

  const pageResponse = await axios.get(
    `${graphBaseUrl}/${env.facebook.pageId}`,
    {
      params: {
        fields: 'id,name,instagram_business_account{id,username}',
        access_token: pageToken,
      },
    },
  );

  console.log('Testing Instagram Business Discovery...');
  console.log('Page:', pageResponse.data.name, `(${pageResponse.data.id})`);
  console.log('Instagram linked:', pageResponse.data.instagram_business_account ?? 'NO');
  console.log('Target:', `@${env.instagram.targetUsername}`);
  console.log('Keywords:', env.instagram.keywords.join(', '));

  if (missingInstagramScopes.length > 0) {
    console.warn(
      'Missing token scopes:',
      missingInstagramScopes.join(', '),
      '→ regenerate token in Graph API Explorer with these permissions.',
    );
  }

  if (!pageResponse.data.instagram_business_account?.id) {
    throw new Error(
      'Link Instagram Business account to your Facebook Page in Meta Business Suite first.',
    );
  }

  const posts = await instagramService.fetchRecentPosts();
  console.log(`Fetched ${posts.length} post(s) from Instagram API`);

  const matched = posts.filter((post) =>
    matchesInstagramKeywords(post.caption, env.instagram.keywords),
  );

  console.log(`Arsenal-related posts: ${matched.length}`);

  for (const post of matched.slice(0, 5)) {
    console.log('---');
    console.log('Title:', captionToTitle(post.caption, `Instagram @${post.username}`));
    console.log('Published:', post.publishedAt.toISOString());
    console.log('URL:', post.permalink);
    console.log('Image:', post.imageUrl || '(none)');
    console.log('Caption:', post.caption.slice(0, 200));
  }
}

main().catch((error: unknown) => {
  console.error('Instagram test failed:', extractError(error));
  process.exit(1);
});
