/**
 * ISSUE-023 · Feature Flag Engine — Core
 *
 * Feature enum used across both Convex backend and Next.js frontend.
 * This is THE single source of truth for what features exist in the system.
 */

export enum Feature {
  // Core — always on
  STUDENTS = 'students',
  STAFF = 'staff',
  ATTENDANCE = 'attendance',
  FEES = 'fees',
  ZRA_INVOICING = 'zra_invoicing',
  GUARDIAN_PORTAL = 'guardian_portal',
  SMS_NOTIFICATIONS = 'sms_notifications',
  SCHOOL_CUSTOMISATION = 'school_customisation',

  // Academic variants
  ECZ_EXAMS = 'ecz_exams',
  SEMESTER_SYSTEM = 'semester_system',
  GPA = 'gpa',
  HEA_COMPLIANCE = 'hea_compliance',
  LMS = 'lms',
  PORTFOLIO = 'portfolio',
  TIMETABLE = 'timetable',

  // Residential
  BOARDING = 'boarding',
  POCKET_MONEY = 'pocket_money',
  SICK_BAY = 'sick_bay',
  VISITOR_LOG = 'visitor_log',
  MEAL_PLANS = 'meal_plans',

  // Transport
  TRANSPORT = 'transport',
  GPS_TRACKING = 'gps_tracking',

  // Library
  LIBRARY = 'library',
  ELIBRARY = 'elibrary',

  // Optional Add-ons
  SPORTS = 'sports',
  CANTEEN = 'canteen',
  ASSET_MANAGEMENT = 'asset_mgmt',
  AI_INSIGHTS = 'ai_insights',
  PTM_SCHEDULER = 'ptm_scheduler',
  PERIOD_ATTENDANCE = 'period_attendance',
  WHATSAPP_NOTIFICATIONS = 'whatsapp_notifications',
}

/** Core features that are always enabled for every school */
export const CORE_FEATURES: Feature[] = [
  Feature.STUDENTS,
  Feature.STAFF,
  Feature.ATTENDANCE,
  Feature.FEES,
  Feature.ZRA_INVOICING,
  Feature.GUARDIAN_PORTAL,
  Feature.SMS_NOTIFICATIONS,
  Feature.SCHOOL_CUSTOMISATION,
];

/**
 * Check if a feature is a core feature (always on).
 */
export function isCoreFeature(feature: Feature): boolean {
  return CORE_FEATURES.includes(feature);
}
