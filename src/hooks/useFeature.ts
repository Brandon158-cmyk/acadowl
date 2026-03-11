'use client';

import { Feature } from '@/lib/features/flags';
import { useSchool } from '@/hooks/useSchool';

/**
 * ISSUE-023 · useFeature hook
 *
 * Check if a feature is enabled for the current school.
 * Returns false if school data hasn't loaded yet (prevents flash of gated content).
 */
export function useFeature(feature: Feature): boolean {
  try {
    const { hasFeature, isLoading } = useSchool();
    if (isLoading) return false;
    return hasFeature(feature);
  } catch {
    // SchoolProvider not yet mounted
    return false;
  }
}
