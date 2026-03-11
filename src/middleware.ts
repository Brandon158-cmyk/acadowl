import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { extractSlugFromHost, isPlatformDomain } from '@/lib/utils/schoolSlug';
import { convexAuthNextjsMiddleware } from '@convex-dev/auth/nextjs/server';

/**
 * Next.js Middleware
 *
 * Runs before every request. Responsibilities:
 * 1. Extract school slug from hostname and inject as `x-school-slug` header
 * 2. Handle platform admin subdomain separately
 * 3. Redirect to www if no slug found on non-public paths
 */
export default convexAuthNextjsMiddleware((request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const host = request.headers.get('host') ?? '';

  // platform subdomain
  if (isPlatformDomain(host)) {
    const headers = new Headers(request.headers);
    headers.set('x-school-slug', '__platform__');
    return NextResponse.next({
      request: { headers },
    });
  }

  // extract slug
  let schoolSlug = extractSlugFromHost(host);
  if (!schoolSlug) {
    schoolSlug = request.nextUrl.searchParams.get('school');
  }

  if (schoolSlug) {
    const headers = new Headers(request.headers);
    headers.set('x-school-slug', schoolSlug);
    return NextResponse.next({
      request: { headers },
    });
  }

  // public paths
  const PUBLIC_PATHS = [
    '/',
    '/onboard',
    '/login',
    '/register',
    '/seed-admin',
    '/platform-register',
  ];
  const isPublicPath = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));

  if (!isPublicPath) {
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.next();
    }
    return NextResponse.redirect(new URL('https://www.eduzambia.zm'));
  }

  return NextResponse.next();
});

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
