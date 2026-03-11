import { Role, Permission } from './types';

/**
 * Role → Permission[] mapping.
 * ISSUE-027 · The single source of truth for all access control decisions.
 *
 * When adding a new role or permission in future sprints,
 * update this matrix — don't scatter checks across the codebase.
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  platform_admin: Object.values(Permission), // All permissions

  school_admin: [
    // Students
    Permission.ENROL_STUDENT,
    Permission.VIEW_STUDENTS,
    Permission.EDIT_STUDENT,
    Permission.TRANSFER_STUDENT,
    Permission.PROMOTE_STUDENTS,
    // Staff
    Permission.CREATE_STAFF,
    Permission.VIEW_STAFF,
    Permission.EDIT_STAFF,
    // Attendance
    Permission.MARK_ATTENDANCE,
    Permission.VIEW_ATTENDANCE,
    Permission.EDIT_ATTENDANCE_RETROACTIVE,
    // Exams
    Permission.CREATE_EXAM_SESSION,
    Permission.ENTER_MARKS,
    Permission.LOCK_MARKS,
    Permission.VIEW_ALL_RESULTS,
    Permission.VIEW_CLASS_RESULTS,
    Permission.GENERATE_REPORT_CARDS,
    // Finance
    Permission.CREATE_INVOICE,
    Permission.EDIT_INVOICE,
    Permission.VOID_INVOICE,
    Permission.RECORD_PAYMENT,
    Permission.VIEW_FINANCE_REPORTS,
    Permission.MANAGE_FEE_STRUCTURE,
    // Boarding
    Permission.MANAGE_HOSTELS,
    Permission.ASSIGN_BEDS,
    Permission.MANAGE_VISITORS,
    Permission.MANAGE_SICK_BAY,
    Permission.DISBURSE_POCKET_MONEY,
    // Transport
    Permission.MANAGE_ROUTES,
    Permission.MANAGE_VEHICLES,
    Permission.VIEW_LIVE_GPS,
    // Library
    Permission.MANAGE_LIBRARY_CATALOG,
    Permission.ISSUE_BOOKS,
    Permission.RETURN_BOOKS,
    // LMS
    Permission.CREATE_COURSE,
    Permission.MANAGE_COURSE_CONTENT,
    Permission.VIEW_LMS_ANALYTICS,
    // Notifications
    Permission.SEND_BULK_SMS,
    Permission.SEND_CLASS_SMS,
    Permission.SEND_FEE_REMINDERS,
    // Settings
    Permission.MANAGE_SCHOOL_SETTINGS,
    Permission.MANAGE_FEATURE_FLAGS,
    Permission.MANAGE_USERS,
    // Reporting
    Permission.EXPORT_MOE_RETURNS,
    Permission.VIEW_SCHOOL_ANALYTICS,
  ],

  deputy_head: [
    Permission.VIEW_STUDENTS,
    Permission.EDIT_STUDENT,
    Permission.TRANSFER_STUDENT,
    Permission.PROMOTE_STUDENTS,
    Permission.VIEW_STAFF,
    Permission.MARK_ATTENDANCE,
    Permission.VIEW_ATTENDANCE,
    Permission.EDIT_ATTENDANCE_RETROACTIVE,
    Permission.CREATE_EXAM_SESSION,
    Permission.ENTER_MARKS,
    Permission.LOCK_MARKS,
    Permission.VIEW_ALL_RESULTS,
    Permission.VIEW_CLASS_RESULTS,
    Permission.GENERATE_REPORT_CARDS,
    Permission.VIEW_FINANCE_REPORTS,
    Permission.SEND_BULK_SMS,
    Permission.SEND_CLASS_SMS,
    Permission.EXPORT_MOE_RETURNS,
    Permission.VIEW_SCHOOL_ANALYTICS,
  ],

  bursar: [
    Permission.VIEW_STUDENTS,
    Permission.CREATE_INVOICE,
    Permission.EDIT_INVOICE,
    Permission.VOID_INVOICE,
    Permission.RECORD_PAYMENT,
    Permission.VIEW_FINANCE_REPORTS,
    Permission.MANAGE_FEE_STRUCTURE,
    Permission.SEND_FEE_REMINDERS,
    Permission.VIEW_SCHOOL_ANALYTICS,
  ],

  teacher: [
    Permission.VIEW_STUDENTS,
    Permission.MARK_ATTENDANCE,
    Permission.VIEW_ATTENDANCE,
    Permission.ENTER_MARKS,
    Permission.VIEW_CLASS_RESULTS,
    Permission.CREATE_COURSE,
    Permission.MANAGE_COURSE_CONTENT,
    Permission.SEND_CLASS_SMS,
  ],

  class_teacher: [
    Permission.VIEW_STUDENTS,
    Permission.EDIT_STUDENT,
    Permission.MARK_ATTENDANCE,
    Permission.VIEW_ATTENDANCE,
    Permission.ENTER_MARKS,
    Permission.VIEW_CLASS_RESULTS,
    Permission.GENERATE_REPORT_CARDS,
    Permission.CREATE_COURSE,
    Permission.MANAGE_COURSE_CONTENT,
    Permission.SEND_CLASS_SMS,
  ],

  matron: [
    Permission.VIEW_STUDENTS,
    Permission.MANAGE_HOSTELS,
    Permission.ASSIGN_BEDS,
    Permission.MANAGE_VISITORS,
    Permission.MANAGE_SICK_BAY,
    Permission.DISBURSE_POCKET_MONEY,
    Permission.MARK_ATTENDANCE,
    Permission.VIEW_ATTENDANCE,
  ],

  librarian: [
    Permission.VIEW_STUDENTS,
    Permission.MANAGE_LIBRARY_CATALOG,
    Permission.ISSUE_BOOKS,
    Permission.RETURN_BOOKS,
  ],

  driver: [Permission.VIEW_LIVE_GPS],

  guardian: [
    // Parents see data through the guardian portal — not through permission checks
    // Their access is controlled by guardianLinks on the student record
  ],

  student: [
    // Students see data through the student portal
    // Their access is controlled by their enrollment
  ],
};

/**
 * Pure function — check if a role has a specific permission.
 * No DB calls, no async — safe to use anywhere.
 */
export function canDo(userRole: Role, permission: Permission): boolean {
  return ROLE_PERMISSIONS[userRole]?.includes(permission) ?? false;
}

/**
 * Check if a role has any of the given permissions.
 */
export function canDoAny(userRole: Role, permissions: Permission[]): boolean {
  return permissions.some((p) => canDo(userRole, p));
}
