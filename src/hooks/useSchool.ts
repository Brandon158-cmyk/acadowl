'use client';

import { useContext } from 'react';
import { SchoolContext } from '@/providers/SchoolProvider';

/**
 * ISSUE-019 · useSchool hook
 *
 * Returns the current school context including school document,
 * enabled features, branding, and academic configuration.
 *
 * @throws if used outside of SchoolProvider
 */
export function useSchool() {
  const context = useContext(SchoolContext);
  if (!context) {
    throw new Error('useSchool must be used within a SchoolProvider');
  }
  return context;
}
