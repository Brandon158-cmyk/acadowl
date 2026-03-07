import { QueryCtx, MutationCtx } from '../_generated/server';
import { Doc } from '../_generated/dataModel';
import { getAuthenticatedUserAndSchool, getAuthenticatedUser } from './schoolContext';
import { EduError, throwEduError } from './errors';
import { Role, Permission } from '../../src/lib/roles/types';
import { canDo } from '../../src/lib/roles/matrix';

/**
 * ISSUE-029 · Convex-Level Role Enforcement
 *
 * Every Convex mutation and query that is not public must enforce
 * role requirements at the function level. This is the backstop.
 */

/**
 * Require the user to have one of the specified roles.
 *
 * @throws FORBIDDEN if user's role not in allowedRoles
 * @returns The authenticated user and school
 */
export async function requireRole(
  ctx: QueryCtx | MutationCtx,
  allowedRoles: Role[],
): Promise<{ user: Doc<'users'>; school: Doc<'schools'> }> {
  const { user, school } = await getAuthenticatedUserAndSchool(ctx);

  if (!user.role || !allowedRoles.includes(user.role as Role)) {
    throwEduError(EduError.FORBIDDEN, `This action requires one of: ${allowedRoles.join(', ')}`);
  }

  return { user, school };
}

/**
 * Require the user to have a specific permission.
 * Uses the ROLE_PERMISSIONS matrix — no hardcoded role checks.
 *
 * @throws FORBIDDEN if user's role lacks the permission
 * @returns The authenticated user and school
 */
export async function requirePermission(
  ctx: QueryCtx | MutationCtx,
  permission: Permission,
): Promise<{ user: Doc<'users'>; school: Doc<'schools'> }> {
  const { user, school } = await getAuthenticatedUserAndSchool(ctx);

  if (!user.role || !canDo(user.role as Role, permission)) {
    throwEduError(EduError.FORBIDDEN, `Missing required permission: ${permission}`);
  }

  return { user, school };
}

/**
 * Shorthand: require school_admin or platform_admin.
 */
export async function requireSchoolAdmin(
  ctx: QueryCtx | MutationCtx,
): Promise<{ user: Doc<'users'>; school: Doc<'schools'> }> {
  return requireRole(ctx, ['school_admin', 'platform_admin']);
}

/**
 * Shorthand: require platform_admin only.
 */
export async function requirePlatformAdmin(ctx: QueryCtx | MutationCtx): Promise<Doc<'users'>> {
  const user = await getAuthenticatedUser(ctx);
  if (user.role !== 'platform_admin') {
    throwEduError(EduError.FORBIDDEN, 'Platform admin access required.');
  }
  return user;
}

// Re-export canDo for convenience in Convex functions
export { canDo } from '../../src/lib/roles/matrix';
