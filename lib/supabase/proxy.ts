import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Reusable session-refresh helper for Next.js 16 Proxy.
 *
 * Synchronizes refreshed Supabase authentication tokens between request cookies
 * and outgoing response headers, ensuring Server Components and browser clients
 * always receive up-to-date session state.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabasePublishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabasePublishableKey) {
    // If environment variables are missing, return early without modifying response.
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        // 1. Update request cookies so downstream Server Components see the refreshed tokens
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );

        // 2. Clone response with the updated request headers
        supabaseResponse = NextResponse.next({
          request,
        });

        // 3. Update response cookies so the browser stores the refreshed tokens
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );

        // 4. Propagate security/cache headers from Supabase SSR if provided
        if (headers) {
          Object.entries(headers).forEach(([key, value]) =>
            supabaseResponse.headers.set(key, value)
          );
        }
      },
    },
  });

  // IMPORTANT: auth.getUser() calls the Supabase Auth server, validating the JWT
  // and triggering an automatic token refresh if expired.
  // Do not remove this call or place arbitrary blocking logic before it.
  await supabase.auth.getUser();

  return supabaseResponse;
}
