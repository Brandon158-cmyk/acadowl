import { describe, it, expect } from 'vitest';
import { getSchoolSlug, extractSlugFromHost, isPlatformDomain } from './schoolSlug';

describe('schoolSlug utility', () => {
  describe('extractSlugFromHost', () => {
    it('extracts slug from a production domain', () => {
      expect(extractSlugFromHost('kabulonga.eduzambia.zm')).toBe('kabulonga');
      expect(extractSlugFromHost('chengelo-secondary.eduzambia.zm')).toBe('chengelo-secondary');
    });

    it('extracts slug from a development domain', () => {
      expect(extractSlugFromHost('kabulonga.localhost')).toBe('kabulonga');
      expect(extractSlugFromHost('evelyn-hone.localhost:3000')).toBe('evelyn-hone');
    });

    it('returns null for reserved subdomains', () => {
      expect(extractSlugFromHost('www.eduzambia.zm')).toBeNull();
      expect(extractSlugFromHost('api.eduzambia.zm')).toBeNull();
      expect(extractSlugFromHost('platform.eduzambia.zm')).toBeNull();
      expect(extractSlugFromHost('admin.localhost')).toBeNull();
    });

    it('returns null for domains missing the base domain structure', () => {
      expect(extractSlugFromHost('eduzambia.zm')).toBeNull();
      expect(extractSlugFromHost('localhost:3000')).toBeNull();
      expect(extractSlugFromHost('google.com')).toBeNull();
    });
  });

  describe('isPlatformDomain', () => {
    it('identifies platform domains correctly', () => {
      expect(isPlatformDomain('platform.eduzambia.zm')).toBe(true);
      expect(isPlatformDomain('platform.localhost:3000')).toBe(true);
    });

    it('rejects non-platform domains', () => {
      expect(isPlatformDomain('kabulonga.eduzambia.zm')).toBe(false);
      expect(isPlatformDomain('www.eduzambia.zm')).toBe(false);
    });
  });

  describe('getSchoolSlug', () => {
    it('prioritizes the x-school-slug header if present', () => {
      const headers = new Headers();
      headers.set('x-school-slug', 'kabulonga');
      headers.set('host', 'chengelo.eduzambia.zm');

      expect(getSchoolSlug(headers)).toBe('kabulonga');
    });

    it('falls back to host extraction if x-school-slug is missing', () => {
      const headers = new Headers();
      headers.set('host', 'chengelo.eduzambia.zm');

      expect(getSchoolSlug(headers)).toBe('chengelo');
    });

    it('returns null if neither is valid', () => {
      const headers = new Headers();
      headers.set('host', 'platform.eduzambia.zm');

      expect(getSchoolSlug(headers)).toBeNull();
    });
  });
});
