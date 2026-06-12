export function matchesInstagramKeywords(
  text: string,
  keywords: string[],
): boolean {
  if (keywords.length === 0) {
    return true;
  }

  const normalized = text.toLowerCase();
  return keywords.some((keyword) => normalized.includes(keyword.toLowerCase()));
}

export function captionToTitle(caption: string, fallback: string): string {
  const line = caption.split('\n')[0]?.trim() ?? '';
  const title = line || fallback;
  return title.length > 120 ? `${title.slice(0, 117)}...` : title;
}
