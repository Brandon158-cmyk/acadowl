import { QueryCtx, MutationCtx, ActionCtx } from '../_generated/server';
import { Doc, Id } from '../_generated/dataModel';
import { EduError, throwEduError } from './errors';
import { api } from '../_generated/api';

/**
 * Internal helper to resolve a user record with multi-stage fallbacks.
 * Matches logic in users/queries:getMe.
 */
export async function resolveUser(
  ctx: QueryCtx | MutationCtx,
  identity: { tokenIdentifier: string; email?: string | undefined },
): Promise<Doc<'users'> | null> {
  // 1. Exact match (Current session)
  const exactUser = await ctx.db
    .query('users')
    .withIndex('tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
    .unique();

  if (exactUser) return exactUser;

  // 2. Session-based match (The most authoritative fallback for Convex Auth)
  const parts = identity.tokenIdentifier.split('|');
  if (parts.length >= 3) {
    const sessionId = parts[2] as Id<'authSessions'>;
    const session = (await ctx.db.get(sessionId)) as any;
    if (session && session.userId) {
      const user = await ctx.db.get(session.userId as Id<'users'>);
      if (user) return user as Doc<'users'>;
    }
  }

  // 3. Email Fallback
  if (identity.email) {
    const emailUser = await ctx.db
      .query('users')
      .withIndex('email', (q) => q.eq('email', identity.email!))
      .first();
    if (emailUser) return emailUser;
  }

  return null;
}

/**
 * Extract and validate the authenticated user and their school from the auth context.
 */
export async function getAuthenticatedUserAndSchool(
  ctx: QueryCtx | MutationCtx | ActionCtx,
): Promise<{ user: Doc<'users'>; school: Doc<'schools'> }> {
  if ('db' in ctx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throwEduError(EduError.UNAUTHENTICATED);

    const user = await resolveUser(ctx, identity!);
    if (!user) throwEduError(EduError.UNAUTHENTICATED, 'User not found.');
    if (user.isActive === false) throwEduError(EduError.ACCOUNT_INACTIVE);
    if (!user.schoolId) throwEduError(EduError.SCHOOL_NOT_FOUND);

    const school = await ctx.db.get(user.schoolId);
    if (!school) throwEduError(EduError.SCHOOL_NOT_FOUND);
    if (school.status === 'suspended') throwEduError(EduError.SCHOOL_SUSPENDED);

    return { user, school };
  } else {
    // Action context
    const data = await ctx.runQuery(api.users.queries.getMe);
    if (!data || !data.user || !data.school) {
      throwEduError(EduError.UNAUTHENTICATED, 'User or school context not found.');
    }
    return { user: data.user as Doc<'users'>, school: data.school as Doc<'schools'> };
  }
}

/**
 * Pattern: every school-scoped query/mutation MUST use this.
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
export async function getAuthenticatedUser(
  ctx: QueryCtx | MutationCtx | ActionCtx,
): Promise<Doc<'users'>> {
  if ('db' in ctx) {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throwEduError(EduError.UNAUTHENTICATED);
    const user = await resolveUser(ctx, identity!);
    if (!user) throwEduError(EduError.UNAUTHENTICATED, 'User not found.');
    if (user.isActive === false) throwEduError(EduError.ACCOUNT_INACTIVE);
    return user;
  } else {
    const data = await ctx.runQuery(api.users.queries.getMe);
    if (!data || !data.user) throwEduError(EduError.UNAUTHENTICATED, 'User not found.');
    return data.user as Doc<'users'>;
  }
}

/**
 * Require platform admin role.
 */
export async function requirePlatformAdmin(
  ctx: QueryCtx | MutationCtx | ActionCtx,
): Promise<Doc<'users'>> {
  const user = await getAuthenticatedUser(ctx);
  if (user.role !== 'platform_admin') {
    throwEduError(EduError.FORBIDDEN, 'Only platform administrators can perform this action.');
  }
  return user;
}
