'use client';

import { createContext, type ReactNode } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Doc } from '../../convex/_generated/dataModel';
import { Feature } from '@/lib/features/flags';

/**
 * ISSUE-019 · SchoolProvider
 *
 * Makes the current school's data available to any client component.
 * Includes school document, enabled features, branding, and academic config.
 */

export interface SchoolContextValue {
  school: Doc<'schools'>;
  features: Feature[];
  gradingMode: Doc<'schools'>['gradingMode'];
  academicMode: Doc<'schools'>['academicMode'];
  branding: Doc<'schools'>['branding'];
  hasFeature: (feature: Feature) => boolean;
  isLoading: false;
}

export interface SchoolContextLoading {
  school: null;
  features: [];
  gradingMode: null;
  academicMode: null;
  branding: null;
  hasFeature: (feature: Feature) => false;
  isLoading: true;
}

export type SchoolContextType = SchoolContextValue | SchoolContextLoading;

export const SchoolContext = createContext<SchoolContextType | null>(null);

interface SchoolProviderProps {
  slug: string | null;
  children: ReactNode;
}

export function SchoolProvider({ slug, children }: SchoolProviderProps) {
  const school = useQuery(api.schools.queries.getSchoolBySlug, slug ? { slug } : 'skip');

  const contextValue: SchoolContextType =
    school === undefined || !school
      ? {
          school: null,
          features: [],
          gradingMode: null,
          academicMode: null,
          branding: null,
          hasFeature: () => false as false,
          isLoading: true as const,
        }
      : {
          school,
          features: (school.enabledFeatures || []) as Feature[],
          gradingMode: school.gradingMode,
          academicMode: school.academicMode,
          branding: school.branding,
          hasFeature: (feature: Feature) => (school.enabledFeatures || []).includes(feature),
          isLoading: false as const,
        };

  return <SchoolContext.Provider value={contextValue}>{children}</SchoolContext.Provider>;
}
