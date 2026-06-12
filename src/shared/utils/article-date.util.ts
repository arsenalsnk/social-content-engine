export type ArticleDateFilterMode = 'today' | 'hours';

interface HasPublishedAt {
  publishedAt: Date;
}

const dayFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getDayFormatter(timezone: string): Intl.DateTimeFormat {
  const cached = dayFormatterCache.get(timezone);
  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  dayFormatterCache.set(timezone, formatter);
  return formatter;
}

export function formatCalendarDay(date: Date, timezone: string): string {
  return getDayFormatter(timezone).format(date);
}

export function sortByPublishedAtDesc<T extends HasPublishedAt>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => b.publishedAt.getTime() - a.publishedAt.getTime(),
  );
}

export function sortByPublishedAtAsc<T extends HasPublishedAt>(items: T[]): T[] {
  return [...items].sort(
    (a, b) => a.publishedAt.getTime() - b.publishedAt.getTime(),
  );
}

export function isArticleRecent(publishedAt: Date, maxAgeHours: number): boolean {
  if (maxAgeHours <= 0) {
    return true;
  }

  const ageMs = Date.now() - publishedAt.getTime();
  return ageMs <= maxAgeHours * 60 * 60 * 1000;
}

export function isPublishedToday(
  publishedAt: Date,
  timezone: string,
  referenceDate: Date = new Date(),
): boolean {
  return (
    formatCalendarDay(publishedAt, timezone) ===
    formatCalendarDay(referenceDate, timezone)
  );
}

export function isArticleEligible(
  publishedAt: Date,
  mode: ArticleDateFilterMode,
  options: {
    maxAgeHours: number;
    timezone: string;
    referenceDate?: Date;
  },
): boolean {
  if (mode === 'today') {
    return isPublishedToday(
      publishedAt,
      options.timezone,
      options.referenceDate ?? new Date(),
    );
  }

  return isArticleRecent(publishedAt, options.maxAgeHours);
}
