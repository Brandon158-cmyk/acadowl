import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { extractSlugFromHost, isPlatformDomain } from '@/lib/utils/schoolSlug';

/**
 * Next.js Middleware
 *
 * Runs before every request. Responsibilities:
 * 1. Extract school slug from hostname and inject as `x-school-slug` header
 * 2. Handle platform admin subdomain separately
 * 3. Redirect to www if no slug found on non-public paths
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') ?? '';

  // Allow static assets, API routes, and _next internal routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/icons') ||
    pathname === '/manifest.json' ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Platform admin subdomain — don't resolve a school
  if (isPlatformDomain(host)) {
    const headers = new Headers(request.headers);
    headers.set('x-school-slug', '__platform__');
    return NextResponse.next({
      request: { headers },
    });
  }

  // Try to extract school slug from hostname
  let schoolSlug = extractSlugFromHost(host);

  // Fallback: check query param ?school=kabulonga
  if (!schoolSlug) {
    schoolSlug = request.nextUrl.searchParams.get('school');
  }

  // If we have a slug, inject it into headers
  if (schoolSlug) {
    const headers = new Headers(request.headers);
    headers.set('x-school-slug', schoolSlug);
    return NextResponse.next({
      request: { headers },
    });
  }

  // No slug found — if not on public path, redirect to main site
  const PUBLIC_PATHS = ['/', '/onboard', '/login', '/register'];
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (!isPublicPath) {
    // In development, just continue (no redirect to avoid breaking dev)
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.next();
    }

    // Production: redirect to www
    return NextResponse.redirect(new URL('https://www.eduzambia.zm'));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
