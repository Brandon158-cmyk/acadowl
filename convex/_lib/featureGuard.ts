import { Doc } from '../_generated/dataModel';
import { EduError, throwEduError } from './errors';

/**
 * ISSUE-009 / ISSUE-023 · Feature Guard (Server-side)
 *
 * Enforce feature flag checks in Convex mutations/queries.
 * Every function that belongs to an optional module must call this.
 */

/**
 * Require a feature to be enabled for the school.
 *
 * @throws FEATURE_DISABLED if the feature is not in school.enabledFeatures
 */
export function requireFeature(school: Doc<'schools'>, feature: string): void {
  if (!school.enabledFeatures.includes(feature)) {
    throwEduError(
      EduError.FEATURE_DISABLED,
      `The "${feature}" feature is not enabled for ${school.name}.`,
    );
  }
}

/**
 * Check if a feature is enabled for a school (non-throwing).
 */
export function hasFeature(school: Doc<'schools'>, feature: string): boolean {
  return school.enabledFeatures.includes(feature);
}
