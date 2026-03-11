'use client';

import { Permission } from '@/lib/roles/types';
import { Role } from '@/lib/roles/types';
import { canDo, canDoAny } from '@/lib/roles/matrix';
import { useMe } from '@/hooks/useMe';

/**
 * ISSUE-028 · Permission Hooks
 *
 * Client-side permission utilities that components use to
 * show/hide UI elements based on the current user's permissions.
 */

/**
 * Check a single permission for the current user.
 */
export function usePermission(permission: Permission): boolean {
  const me = useMe();
  if (!me?.user?.role) return false;
  return canDo(me.user.role as Role, permission);
}

/**
 * Batch check multiple permissions.
 */
export function usePermissions(permissions: Permission[]): Record<string, boolean> {
  const me = useMe();
  const role = me?.user?.role as Role | undefined;
  const result: Record<string, boolean> = {};
  for (const p of permissions) {
    result[p] = role ? canDo(role, p) : false;
  }
  return result;
}

/**
 * Check if the user has any of the given permissions.
 */
export function useHasAnyPermission(permissions: Permission[]): boolean {
  const me = useMe();
  if (!me?.user?.role) return false;
  return canDoAny(me.user.role as Role, permissions);
}
