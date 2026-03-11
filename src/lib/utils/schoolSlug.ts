import { headers } from 'next/headers';

/**
 * Extract the school slug from the current request.
 *
 * Extraction order (first match wins):
 * 1. Production: `kabulonga.eduzambia.zm` → 'kabulonga'
 * 2. Development: `kabulonga.localhost:3000` → 'kabulonga'
 * 3. Fallback: `?school=kabulonga` query param (for envs without subdomain support)
 * 4. Header: `x-school-slug` (injected by middleware)
 *
 * @param headersList - The request headers from next/headers
 * @returns The school slug string or null if none found
 */
export function getSchoolSlug(headersList: Headers): string | null {
  // First check if middleware already injected the slug
  const headerSlug = headersList.get('x-school-slug');
  if (headerSlug) return headerSlug;

  // Fallback: try to extract from the host header
  const host = headersList.get('host');
  if (!host) return null;

  return extractSlugFromHost(host);
}

/**
 * Extract school slug from a hostname.
 *
 * @param host - The hostname (e.g., 'kabulonga.eduzambia.zm', 'kabulonga.localhost:3000')
 * @returns The school slug or null
 */
export function extractSlugFromHost(host: string): string | null {
  // Remove port if present
  const hostname = host.split(':')[0];

  // Skip known non-school subdomains
  const RESERVED_SUBDOMAINS = ['www', 'platform', 'api', 'admin'];

  // Production: kabulonga.eduzambia.zm
  const prodMatch = hostname.match(/^([a-z0-9-]+)\.eduzambia\.zm$/);
  if (prodMatch && !RESERVED_SUBDOMAINS.includes(prodMatch[1])) {
    return prodMatch[1];
  }

  // Development: kabulonga.localhost
  const devMatch = hostname.match(/^([a-z0-9-]+)\.localhost$/);
  if (devMatch && !RESERVED_SUBDOMAINS.includes(devMatch[1])) {
    return devMatch[1];
  }

  return null;
}

/**
 * Check if the current request is for the platform admin subdomain.
 */
export function isPlatformDomain(host: string): boolean {
  const hostname = host.split(':')[0];
  return hostname === 'platform.eduzambia.zm' || hostname === 'platform.localhost';
}

/**
 * Get the school slug from Next.js server components using the headers() API.
 */
export async function getSchoolSlugFromHeaders(): Promise<string | null> {
  const headersList = await headers();
  return getSchoolSlug(headersList);
}
