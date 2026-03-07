'use client';

import { Permission } from '@/lib/roles/types';
import { canDo } from '@/lib/roles/matrix';

/**
 * ISSUE-028 · Permission Hooks
 *
 * Client-side permission utilities that components use to
 * show/hide UI elements based on the current user's permissions.
 */

/**
 * Check a single permission for the current user.
 *
 * @example
 * const canMarkAttendance = usePermission(Permission.MARK_ATTENDANCE);
 */
export function usePermission(permission: Permission): boolean {
  // TODO: Connect to useMe() once the hook is built
  return false;
}

/**
 * Batch check multiple permissions.
 *
 * @example
 * const perms = usePermissions([Permission.MARK_ATTENDANCE, Permission.VIEW_STUDENTS]);
 * if (perms[Permission.MARK_ATTENDANCE]) { ... }
 */
export function usePermissions(permissions: Permission[]): Record<string, boolean> {
  const result: Record<string, boolean> = {};
  for (const p of permissions) {
    result[p] = false; // TODO: Connect to useMe()
  }
  return result;
}

/**
 * Check if the user has any of the given permissions.
 */
export function useHasAnyPermission(permissions: Permission[]): boolean {
  return permissions.some((p) => usePermission(p));
}
