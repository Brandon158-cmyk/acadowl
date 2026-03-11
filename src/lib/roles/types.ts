/**
 * Role and Permission types for the EduZambia system.
 * ISSUE-027 · Role & Permission Matrix
 *
 * These are shared between Convex backend and Next.js frontend.
 */

export type Role =
  | 'platform_admin'
  | 'school_admin'
  | 'deputy_head'
  | 'bursar'
  | 'teacher'
  | 'class_teacher'
  | 'matron'
  | 'librarian'
  | 'driver'
  | 'guardian'
  | 'student';

export enum Permission {
  // Students
  ENROL_STUDENT = 'enrol_student',
  VIEW_STUDENTS = 'view_students',
  EDIT_STUDENT = 'edit_student',
  TRANSFER_STUDENT = 'transfer_student',
  PROMOTE_STUDENTS = 'promote_students',

  // Staff
  CREATE_STAFF = 'create_staff',
  VIEW_STAFF = 'view_staff',
  EDIT_STAFF = 'edit_staff',

  // Attendance
  MARK_ATTENDANCE = 'mark_attendance',
  VIEW_ATTENDANCE = 'view_attendance',
  EDIT_ATTENDANCE_RETROACTIVE = 'edit_attendance_retroactive',

  // Exams
  CREATE_EXAM_SESSION = 'create_exam_session',
  ENTER_MARKS = 'enter_marks',
  LOCK_MARKS = 'lock_marks',
  VIEW_ALL_RESULTS = 'view_all_results',
  VIEW_CLASS_RESULTS = 'view_class_results',
  GENERATE_REPORT_CARDS = 'generate_report_cards',

  // Finance
  CREATE_INVOICE = 'create_invoice',
  EDIT_INVOICE = 'edit_invoice',
  VOID_INVOICE = 'void_invoice',
  RECORD_PAYMENT = 'record_payment',
  VIEW_FINANCE_REPORTS = 'view_finance_reports',
  MANAGE_FEE_STRUCTURE = 'manage_fee_structure',

  // Boarding
  MANAGE_HOSTELS = 'manage_hostels',
  ASSIGN_BEDS = 'assign_beds',
  MANAGE_VISITORS = 'manage_visitors',
  MANAGE_SICK_BAY = 'manage_sick_bay',
  DISBURSE_POCKET_MONEY = 'disburse_pocket_money',

  // Transport
  MANAGE_ROUTES = 'manage_routes',
  MANAGE_VEHICLES = 'manage_vehicles',
  VIEW_LIVE_GPS = 'view_live_gps',

  // Library
  MANAGE_LIBRARY_CATALOG = 'manage_library_catalog',
  ISSUE_BOOKS = 'issue_books',
  RETURN_BOOKS = 'return_books',

  // LMS
  CREATE_COURSE = 'create_course',
  MANAGE_COURSE_CONTENT = 'manage_course_content',
  VIEW_LMS_ANALYTICS = 'view_lms_analytics',

  // Notifications
  SEND_BULK_SMS = 'send_bulk_sms',
  SEND_CLASS_SMS = 'send_class_sms',
  SEND_FEE_REMINDERS = 'send_fee_reminders',

  // Settings
  MANAGE_SCHOOL_SETTINGS = 'manage_school_settings',
  MANAGE_FEATURE_FLAGS = 'manage_feature_flags',
  MANAGE_USERS = 'manage_users',

  // Platform
  MANAGE_ALL_SCHOOLS = 'manage_all_schools',
  VIEW_PLATFORM_ANALYTICS = 'view_platform_analytics',

  // Reporting
  EXPORT_MOE_RETURNS = 'export_moe_returns',
  VIEW_SCHOOL_ANALYTICS = 'view_school_analytics',
}
