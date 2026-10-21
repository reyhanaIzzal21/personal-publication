/**
 * Global SEO Configuration & Helpers
 */

export const SITE_CONFIG = {
  name: 'Reyhana Izzal',
  author: 'Reyhana Izzal',
  title: 'Reyhana Izzal — Personal Publication',
  description:
    'An editorial personal publication by Reyhana Izzal featuring essays, research, hypotheses, and analysis on technology, AI, economics, and society.',
  locale: 'en_US',
  defaultDomain: 'https://reyhanizzal.vercel.app',
};

/**
 * Resolves the absolute canonical base URL for the application.
 * Prioritizes custom environment variable NEXT_PUBLIC_SITE_URL or Vercel production URL,
 * falling back to the verified production domain placeholder https://reyhanizzal.com.
 */
export function getBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (envUrl) {
    const formatted = envUrl.startsWith('http://') || envUrl.startsWith('https://')
      ? envUrl
      : `https://${envUrl}`;
    return formatted.replace(/\/$/, '');
  }
  return SITE_CONFIG.defaultDomain;
}

/**
 * Safely extracts a clean, non-HTML plain text excerpt for meta descriptions.
 * Avoids truncating words in the middle and cleans up whitespace.
 */
export function extractCleanDescription(rawTextOrHtml?: string | null, maxLength = 160): string {
  if (!rawTextOrHtml) return '';

  // 1. Strip HTML tags
  let cleaned = rawTextOrHtml.replace(/<[^>]+>/g, ' ');

  // 2. Normalize whitespace, remove invisible characters
  cleaned = cleaned.replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();

  if (!cleaned) return '';

  if (cleaned.length <= maxLength) {
    return cleaned;
  }

  // 3. Truncate at word boundary
  const sub = cleaned.slice(0, maxLength);
  const lastSpace = sub.lastIndexOf(' ');
  const safeCut = lastSpace > 40 ? sub.slice(0, lastSpace) : sub;

  return `${safeCut.trim()}...`;
}
