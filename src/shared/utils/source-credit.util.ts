export function buildSourceCredit(sourceName: string, articleUrl: string): string {
  return `📰 ที่มา: ${sourceName}\n🔗 ${articleUrl}`;
}

export function appendSourceCredit(
  caption: string,
  sourceName: string,
  articleUrl: string,
): string {
  if (caption.includes(articleUrl) || caption.includes(`ที่มา: ${sourceName}`)) {
    return caption;
  }

  return `${caption.trim()}\n\n${buildSourceCredit(sourceName, articleUrl)}`;
}
