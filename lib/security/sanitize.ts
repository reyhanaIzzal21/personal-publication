/**
 * Server-safe and client-safe HTML sanitizer for editorial content.
 * Prevents XSS, script injection, and malicious URL schemes (javascript:, data:).
 */

const ALLOWED_TAGS = new Set([
  'p',
  'h2',
  'h3',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'strike',
  'ul',
  'ol',
  'li',
  'blockquote',
  'a',
  'br',
  'hr',
  'code',
  'pre',
]);

const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', '#', '/'];

function isSafeUrl(url: string): boolean {
  const trimmed = url.trim().toLowerCase();
  if (trimmed.startsWith('#') || trimmed.startsWith('/')) {
    return true;
  }
  try {
    const parsed = new URL(trimmed);
    return ALLOWED_PROTOCOLS.includes(parsed.protocol);
  } catch {
    // If it cannot be parsed as a URL, check if it's a relative path
    return !trimmed.includes(':') && !trimmed.startsWith('//');
  }
}

/**
 * Sanitizes HTML string by stripping disallowed tags and dangerous attributes.
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== 'string') return '';

  // 1. Remove dangerous script and style elements with their contents
  let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');
  clean = clean.replace(/<!--[\s\S]*?-->/g, '');

  // 2. Process all tags
  clean = clean.replace(/<\/?([a-z0-9-]+)([^>]*)>/gi, (match, tagName: string, rawAttrs: string) => {
    const lowerTag = tagName.toLowerCase();

    if (!ALLOWED_TAGS.has(lowerTag)) {
      return ''; // Strip disallowed tag
    }

    const isClosing = match.startsWith('</');
    if (isClosing) {
      return `</${lowerTag}>`;
    }

    // For allowed self-closing or opening tags, filter attributes
    if (lowerTag === 'a') {
      const hrefMatch = rawAttrs.match(/href=(["'])(.*?)\1/i) || rawAttrs.match(/href=([^"'\s>]+)/i);
      const hrefValue = hrefMatch ? (hrefMatch[2] || hrefMatch[1]) : '';

      if (hrefValue && isSafeUrl(hrefValue)) {
        const cleanHref = hrefValue.replace(/"/g, '&quot;');
        return `<a href="${cleanHref}" target="_blank" rel="noopener noreferrer">`;
      }
      return '<a>';
    }

    if (lowerTag === 'ol') {
      const startMatch = rawAttrs.match(/start=(["']?)(\d+)\1/i);
      if (startMatch) {
        return `<ol start="${startMatch[2]}">`;
      }
      return '<ol>';
    }

    if (lowerTag === 'pre') {
      const langMatch = rawAttrs.match(/data-language=(["'])(.*?)\1/i);
      if (langMatch && langMatch[2]) {
        const cleanLang = langMatch[2].replace(/"/g, '&quot;');
        return `<pre data-language="${cleanLang}">`;
      }
      return '<pre>';
    }

    if (lowerTag === 'blockquote') {
      return '<blockquote>';
    }

    if (lowerTag === 'ul') {
      return '<ul>';
    }

    if (lowerTag === 'li') {
      return '<li>';
    }

    if (lowerTag === 'h2') {
      return '<h2>';
    }

    if (lowerTag === 'h3') {
      return '<h3>';
    }

    if (lowerTag === 'hr') {
      return '<hr>';
    }

    if (lowerTag === 'p') {
      return '<p>';
    }

    // For inline marks: b, strong, i, em, u, s, strike, br, code
    return `<${lowerTag}>`;
  });

  return clean;
}
