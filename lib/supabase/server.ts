import { createServerClient } from '@supabase/ssr';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

/**
 * Creates a request-scoped server-side Supabase client for Server Components,
 * Server Actions, and Route Handlers.
 *
 * Uses the asynchronous cookies() API from next/headers.
 */
export async function createClient() {
  let cookieStore: Awaited<ReturnType<typeof cookies>> | null = null;
  try {
    cookieStore = await cookies();
  } catch {
    // Outside request scope (e.g. CLI scripts or static prerendering)
  }

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

  return createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return cookieStore ? cookieStore.getAll() : [];
      },
      setAll(cookiesToSet) {
        if (!cookieStore) return;
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // In Next.js App Router, cookies cannot be set during Server Component rendering.
          // This can be safely ignored if session refresh is handled by proxy.ts.
        }
      },
    },
  });
}

/**
 * Creates a privileged server-side Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * Use exclusively on the server for operations requiring administrative/storage privileges
 * after authorization checks have already passed (e.g. generating signed URLs for published articles).
 * NEVER expose this client or its key to Client Components or the browser.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }

  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
