import axios from 'axios';

const graphBaseUrl = 'https://graph.facebook.com/v21.0';

const PAGE_SCOPES = new Set([
  'pages_manage_posts',
  'pages_read_engagement',
  'pages_show_list',
]);

interface DebugTokenResponse {
  data?: {
    type?: string;
    is_valid?: boolean;
    granular_scopes?: Array<{
      scope?: string;
      target_ids?: string[];
    }>;
  };
}

interface PageAccount {
  id: string;
  name: string;
  access_token: string;
}

interface AccountsResponse {
  data?: PageAccount[];
}

interface PageTokenResponse {
  access_token?: string;
}

type GranularScope = NonNullable<
  NonNullable<DebugTokenResponse['data']>['granular_scopes']
>[number];

function hasGranularPageAccess(
  granularScopes: GranularScope[] | undefined,
  pageId: string,
): boolean {
  if (!granularScopes?.length) {
    return false;
  }

  return granularScopes.some(
    (entry: GranularScope) =>
      PAGE_SCOPES.has(entry.scope ?? '') &&
      entry.target_ids?.includes(pageId),
  );
}

async function debugToken(accessToken: string): Promise<DebugTokenResponse['data']> {
  const response = await axios.get<DebugTokenResponse>(
    `${graphBaseUrl}/debug_token`,
    {
      params: {
        input_token: accessToken,
        access_token: accessToken,
      },
    },
  );

  return response.data.data;
}

async function fetchPageTokenFromPageNode(
  userAccessToken: string,
  pageId: string,
): Promise<string | null> {
  try {
    const response = await axios.get<PageTokenResponse>(
      `${graphBaseUrl}/${pageId}`,
      {
        params: {
          fields: 'access_token',
          access_token: userAccessToken,
        },
      },
    );

    const pageToken = response.data.access_token?.trim();
    if (!pageToken) {
      return null;
    }

    const tokenInfo = await debugToken(pageToken);
    return tokenInfo?.type === 'PAGE' ? pageToken : null;
  } catch {
    return null;
  }
}

export async function resolvePageAccessToken(
  accessToken: string,
  pageId: string,
): Promise<string> {
  const tokenInfo = await debugToken(accessToken);

  if (tokenInfo?.type === 'PAGE') {
    return accessToken;
  }

  const accountsResponse = await axios.get<AccountsResponse>(
    `${graphBaseUrl}/me/accounts`,
    {
      params: {
        access_token: accessToken,
        fields: 'id,name,access_token',
        limit: 100,
      },
    },
  );

  const pageFromAccounts = accountsResponse.data.data?.find(
    (account) => account.id === pageId,
  );
  if (pageFromAccounts?.access_token) {
    return pageFromAccounts.access_token;
  }

  const pageToken = await fetchPageTokenFromPageNode(accessToken, pageId);
  if (pageToken) {
    return pageToken;
  }

  if (hasGranularPageAccess(tokenInfo?.granular_scopes, pageId)) {
    const granularPageToken = await fetchPageTokenFromPageNode(accessToken, pageId);
    if (granularPageToken) {
      return granularPageToken;
    }
  }

  const availablePages = (accountsResponse.data.data ?? [])
    .map((account) => `${account.name} (${account.id})`)
    .join(', ');

  throw new Error(
    `Page access token not found for page ${pageId}. ` +
      (availablePages
        ? `Available pages: ${availablePages}. Check FACEBOOK_PAGE_ID.`
        : 'Regenerate User token in Graph API Explorer with pages_manage_posts, ' +
          'pages_read_engagement, pages_show_list and select your Page.'),
  );
}
