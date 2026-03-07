'use client';

import { Feature } from '@/lib/features/flags';

/**
 * ISSUE-023 · useFeature hook
 *
 * Check if a feature is enabled for the current school.
 * Returns false if school data hasn't loaded yet (prevents flash of gated content).
 *
 * @example
 * const hasBoardning = useFeature(Feature.BOARDING);
 * if (hasBoarding) { ... }
 */
export function useFeature(feature: Feature): boolean {
  // This will be properly connected to SchoolProvider in ISSUE-019
  // For now, returns false to prevent flash of gated content
  // TODO: Connect to useSchool().features once SchoolProvider is built
  return false;
}
