import { createBrowserClient } from '@supabase/ssr';

/**
 * Creates a browser-side Supabase client for Client Components.
 * Uses public environment variables only.
 */
export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error(
      'Missing environment variable: NEXT_PUBLIC_SUPABASE_URL. Please configure it in your environment.'
    );
  }

  if (!supabasePublishableKey) {
    throw new Error(
      'Missing environment variable: NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY. Please configure it in your environment.'
    );
  }

  return createBrowserClient(supabaseUrl, supabasePublishableKey);
}
