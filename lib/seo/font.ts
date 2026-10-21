import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

let cachedFont: ArrayBuffer | null = null;

/**
 * Loads the local Newsreader serif font for ImageResponse (Satori).
 * Returns undefined on error so Satori can fall back gracefully to system serif.
 */
export async function getNewsreaderFont(): Promise<ArrayBuffer | null> {
  if (cachedFont) {
    return cachedFont;
  }

  try {
    const fontPath = join(process.cwd(), 'assets', 'fonts', 'Newsreader.ttf');
    const buffer = await readFile(fontPath);
    cachedFont = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);
    return cachedFont;
  } catch (err) {
    console.warn('[SEO] Failed to load local Newsreader font, using fallback font:', err);
    return null;
  }
}
