'use client';

import { ReactNode } from 'react';
import { usePermission } from '@/hooks/usePermission';
import { Permission } from '@/lib/roles/types';

/**
 * ISSUE-028 · PermissionGuard Component
 *
 * Wraps content that requires a permission.
 * Used alongside FeatureGuard when both a feature AND a permission are required.
 *
 * @example
 * <PermissionGuard permission={Permission.MARK_ATTENDANCE}>
 *   <AttendanceButton />
 * </PermissionGuard>
 */
interface PermissionGuardProps {
  permission: Permission;
  fallback?: ReactNode;
  children: ReactNode;
}

export function PermissionGuard({ permission, fallback = null, children }: PermissionGuardProps) {
  const hasPermission = usePermission(permission);

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
