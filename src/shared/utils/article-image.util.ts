const NON_PERSON_IMAGE_PATTERN =
  /icon|logo|badge|sprite|avatar-default|placeholder|1x1|pixel|emoji|\.svg(\?|$)|banner|advert|promo|social-share|share-image/i;

export function extractImagesFromHtml(html: string): string[] {
  const matches = html.matchAll(/<img[^>]+src=["']([^"']+)["']/gi);
  const urls: string[] = [];

  for (const match of matches) {
    const url = normalizeImageUrl(match[1]?.trim() ?? '');
    if (url) {
      urls.push(url);
    }
  }

  return [...new Set(urls)];
}

export function isLikelyPersonPhoto(url: string): boolean {
  const normalized = url.trim();
  if (!normalized) {
    return false;
  }

  return !NON_PERSON_IMAGE_PATTERN.test(normalized);
}

export function pickBestArticleImage(candidates: string[]): string {
  const normalized = [...new Set(candidates.map(normalizeImageUrl).filter(Boolean))];
  if (normalized.length === 0) {
    return '';
  }

  const personPhotos = normalized.filter(isLikelyPersonPhoto);
  return personPhotos[0] ?? normalized[0] ?? '';
}

export function normalizeImageUrl(url: string): string {
  if (!url) {
    return '';
  }

  if (url.startsWith('//')) {
    return `https:${url}`;
  }

  return url;
}

export function extractOgImageFromHtml(html: string): string {
  const patterns = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image(?::secure_url)?["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      return normalizeImageUrl(match[1]);
    }
  }

  return '';
}
