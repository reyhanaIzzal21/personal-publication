import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

/**
 * Next.js 16 Proxy Entry Point (formerly middleware.ts).
 *
 * Runs session-refresh logic for incoming requests before routes render.
 * Excludes static files, images, and documents using the matcher configuration.
 */
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /* 
     * Match all request paths except for:
     * - _next/static (static chunks and CSS)
     * - _next/image (image optimization endpoints)
     * - favicon.ico (favicon)
     * - static files with common extensions (images, documents, fonts)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|pdf|woff|woff2|ttf|eot)$).*)',
  ],
};
