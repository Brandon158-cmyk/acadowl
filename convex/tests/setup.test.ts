import { describe, it, expect } from 'vitest';
import { canDo } from '../_lib/permissions';
import { Role, Permission } from '../../src/lib/roles/types';

describe('Convex permissions logic', () => {
  it('correctly maps school_admin permissions', () => {
    // A platform or school admin should definitively have core access like MANAGE_USERS
    const isAdminPermitted = canDo('school_admin' as Role, Permission.MANAGE_USERS);
    const isStudentPermitted = canDo('student' as Role, Permission.MANAGE_USERS);

    expect(isAdminPermitted).toBe(true);
    expect(isStudentPermitted).toBe(false);
  });

  it('correctly evaluates permissions for teachers', () => {
    // A teacher can manage attendance but not global features
    const canMarkAttendance = canDo('teacher' as Role, Permission.MARK_ATTENDANCE);
    const canManageFeatures = canDo('teacher' as Role, Permission.MANAGE_FEATURE_FLAGS);

    expect(canMarkAttendance).toBe(true);
    expect(canManageFeatures).toBe(false);
  });
});
