import { QueryCtx, MutationCtx } from '../_generated/server';
import { Doc, Id } from '../_generated/dataModel';
import { EduError, throwEduError } from './errors';

/**
 * Extract and validate the authenticated user and their school from the auth context.
 *
 * This is the primary auth utility — called at the top of every school-scoped function.
 *
 * @returns The authenticated user document and their school document
 * @throws UNAUTHENTICATED if no auth identity
 * @throws ACCOUNT_INACTIVE if user is deactivated
 * @throws SCHOOL_NOT_FOUND if school doesn't exist
 */
export async function getAuthenticatedUserAndSchool(
  ctx: QueryCtx | MutationCtx,
): Promise<{ user: Doc<'users'>; school: Doc<'schools'> }> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throwEduError(EduError.UNAUTHENTICATED);
  }

  // Find user by Convex Auth token
  const user = await ctx.db
    .query('users')
    .withIndex('tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
    .unique();

  if (!user) {
    throwEduError(EduError.UNAUTHENTICATED, 'User not found. Please log in again.');
  }

  if (user.isActive === false) {
    throwEduError(EduError.ACCOUNT_INACTIVE);
  }

  if (!user.schoolId) {
    // Platform admin — no school context needed
    throwEduError(EduError.SCHOOL_NOT_FOUND, 'No school associated with this account.');
  }

  const school = await ctx.db.get(user.schoolId);
  if (!school) {
    throwEduError(EduError.SCHOOL_NOT_FOUND);
  }

  if (school.status === 'suspended') {
    throwEduError(EduError.SCHOOL_SUSPENDED);
  }

  return { user, school };
}

/**
 * Pattern: every school-scoped query/mutation MUST use this.
 *
 * Wraps the function with automatic auth + school validation.
 *
 * @example
 * ```ts
 * export const getStudents = query({
 *   handler: async (ctx) => {
 *     return withSchoolScope(ctx, async ({ ctx, user, school, schoolId }) => {
 *       return ctx.db.query('students')
 *         .withIndex('by_school', q => q.eq('schoolId', schoolId))
 *         .collect();
 *     });
 *   },
 * });
 * ```
 */
export async function withSchoolScope<T>(
  ctx: QueryCtx | MutationCtx,
  fn: (params: {
    ctx: QueryCtx | MutationCtx;
    user: Doc<'users'>;
    school: Doc<'schools'>;
    schoolId: Id<'schools'>;
  }) => Promise<T>,
): Promise<T> {
  const { user, school } = await getAuthenticatedUserAndSchool(ctx);
  return fn({ ctx, user, school, schoolId: school._id });
}

/**
 * Get an authenticated user without requiring school context.
 * Used for platform admin operations.
 */
export async function getAuthenticatedUser(ctx: QueryCtx | MutationCtx): Promise<Doc<'users'>> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throwEduError(EduError.UNAUTHENTICATED);
  }

  const user = await ctx.db
    .query('users')
    .withIndex('tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
    .unique();

  if (!user) {
    throwEduError(EduError.UNAUTHENTICATED, 'User not found.');
  }

  if (user.isActive === false) {
    throwEduError(EduError.ACCOUNT_INACTIVE);
  }

  return user;
}

/**
 * Require platform admin role.
 * Used for super admin operations that have no school context.
 */
export async function requirePlatformAdmin(ctx: QueryCtx | MutationCtx): Promise<Doc<'users'>> {
  const user = await getAuthenticatedUser(ctx);
  if (user.role !== 'platform_admin') {
    throwEduError(EduError.FORBIDDEN, 'Only platform administrators can perform this action.');
  }
  return user;
}
