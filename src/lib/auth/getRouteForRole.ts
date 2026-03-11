import { Role } from '@/lib/roles/types';

/**
 * ISSUE-014 · Route helper for role-based redirects.
 *
 * Returns the dashboard path given a user's role.
 * Used by auth middleware and login page on successful auth.
 */
export function getRouteForRole(role: Role): string {
  switch (role) {
    case 'platform_admin':
      return '/(platform)/schools';
    case 'school_admin':
    case 'deputy_head':
      return '/(admin)/dashboard';
    case 'bursar':
      return '/(admin)/fees';
    case 'teacher':
    case 'class_teacher':
      return '/(teacher)/dashboard';
    case 'matron':
      return '/(admin)/boarding';
    case 'librarian':
      return '/(admin)/library';
    case 'driver':
      return '/(driver)/route';
    case 'guardian':
      return '/(parent)/dashboard';
    case 'student':
      return '/(student)/dashboard';
    default:
      return '/login';
  }
}

/**
 * Route group that a role belongs to.
 * Used for checking if a user is in the correct route group.
 */
export function getRouteGroupForRole(role: Role): string {
  switch (role) {
    case 'platform_admin':
      return '(platform)';
    case 'school_admin':
    case 'deputy_head':
    case 'bursar':
    case 'matron':
    case 'librarian':
      return '(admin)';
    case 'teacher':
    case 'class_teacher':
      return '(teacher)';
    case 'guardian':
      return '(parent)';
    case 'student':
      return '(student)';
    case 'driver':
      return '(driver)';
    default:
      return '(auth)';
  }
}
