import { createClient } from '@/lib/supabase/server';
import type { User } from '@supabase/supabase-js';

export type AdminAuthResult =
  | { authorized: true; user: User }
  | { authorized: false; reason: 'unauthenticated' }
  | { authorized: false; reason: 'forbidden'; user: User };

/**
 * Verifies if the current request is from an authenticated user with
 * the trusted app_metadata.role === 'admin' claim.
 *
 * Runs exclusively on the server. Never trusts client-side role claims
 * or user-editable user_metadata.
 */
export async function verifyAdmin(): Promise<AdminAuthResult> {
  const supabase = await createClient();

  // Validate the user session against the Supabase Auth server
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { authorized: false, reason: 'unauthenticated' };
  }

  // Check the trusted app_metadata claim (set only via Supabase Dashboard / service role)
  // NEVER check user_metadata.role as that can be modified by the user directly.
  const role = user.app_metadata?.role;

  if (role !== 'admin') {
    return { authorized: false, reason: 'forbidden', user };
  }

  return { authorized: true, user };
}
