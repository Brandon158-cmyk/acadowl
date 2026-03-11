'use client';

import { ReactNode } from 'react';
import { SchoolProvider } from './SchoolProvider';
import { useMe } from '@/hooks/useMe';

/**
 * Wraps the admin area to provide the SchoolContext based on the currently authenticated user's school.
 */
export function AdminSchoolProvider({ children }: { children: ReactNode }) {
  const me = useMe();

  // Get the slug from the user's school. If me is undefined (still loading), pass null.
  const slug = me?.school?.slug ?? null;

  return <SchoolProvider slug={slug}>{children}</SchoolProvider>;
}
