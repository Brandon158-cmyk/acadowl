import { Feature, CORE_FEATURES } from './flags';
import type { SchoolType } from '@/lib/constants/zambia';

/**
 * ISSUE-023 · Feature presets per school type.
 *
 * These determine the default enabled features when a new school
 * is created (ISSUE-017). School admins can adjust these later
 * via the Feature Management UI (ISSUE-024).
 */

/** Feature sets for school types */
const SCHOOL_TYPE_FEATURES: Record<SchoolType, Feature[]> = {
  day_primary: [...CORE_FEATURES, Feature.ECZ_EXAMS, Feature.TIMETABLE],

  day_secondary: [
    ...CORE_FEATURES,
    Feature.ECZ_EXAMS,
    Feature.TIMETABLE,
    Feature.PERIOD_ATTENDANCE,
  ],

  boarding_primary: [
    ...CORE_FEATURES,
    Feature.ECZ_EXAMS,
    Feature.TIMETABLE,
    Feature.BOARDING,
    Feature.POCKET_MONEY,
    Feature.SICK_BAY,
    Feature.VISITOR_LOG,
    Feature.MEAL_PLANS,
  ],

  boarding_secondary: [
    ...CORE_FEATURES,
    Feature.ECZ_EXAMS,
    Feature.TIMETABLE,
    Feature.PERIOD_ATTENDANCE,
    Feature.BOARDING,
    Feature.POCKET_MONEY,
    Feature.SICK_BAY,
    Feature.VISITOR_LOG,
    Feature.MEAL_PLANS,
  ],

  mixed_secondary: [
    ...CORE_FEATURES,
    Feature.ECZ_EXAMS,
    Feature.TIMETABLE,
    Feature.PERIOD_ATTENDANCE,
    Feature.BOARDING,
    Feature.POCKET_MONEY,
    Feature.SICK_BAY,
    Feature.VISITOR_LOG,
    Feature.MEAL_PLANS,
  ],

  college: [
    ...CORE_FEATURES,
    Feature.SEMESTER_SYSTEM,
    Feature.GPA,
    Feature.HEA_COMPLIANCE,
    Feature.LMS,
    Feature.TIMETABLE,
    Feature.PORTFOLIO,
  ],

  technical: [
    ...CORE_FEATURES,
    Feature.SEMESTER_SYSTEM,
    Feature.GPA,
    Feature.TIMETABLE,
    Feature.LMS,
    Feature.PORTFOLIO,
  ],
};

/**
 * Get the default enabled features for a school type.
 *
 * @param schoolType - The school type (from zambia.ts constants)
 * @returns Array of Feature enum values that should be enabled by default
 */
export function getDefaultFeaturesForSchoolType(schoolType: SchoolType): Feature[] {
  return SCHOOL_TYPE_FEATURES[schoolType] ?? CORE_FEATURES;
}

/**
 * Get features grouped by category for the settings UI (ISSUE-024).
 */
export const FEATURE_GROUPS = [
  {
    group: 'Academic',
    features: [
      {
        feature: Feature.ECZ_EXAMS,
        label: 'ECZ Exams',
        description: 'Grade 7, 9, 12 exam tracking and reporting',
      },
      {
        feature: Feature.SEMESTER_SYSTEM,
        label: 'Semester System',
        description: 'Use 2 semesters instead of 3 terms',
      },
      {
        feature: Feature.GPA,
        label: 'GPA Grading',
        description: '4.0 GPA scale for tertiary institutions',
      },
      {
        feature: Feature.HEA_COMPLIANCE,
        label: 'HEA Compliance',
        description: 'Higher Education Authority reporting',
      },
      {
        feature: Feature.LMS,
        label: 'Learning Management',
        description: 'Course content, assignments, online quizzes',
      },
      {
        feature: Feature.PORTFOLIO,
        label: 'Student Portfolios',
        description: 'Project-based learning portfolios',
      },
      {
        feature: Feature.TIMETABLE,
        label: 'Timetable',
        description: 'Class scheduling and teacher timetables',
      },
      {
        feature: Feature.PERIOD_ATTENDANCE,
        label: 'Period Attendance',
        description: 'Track attendance per lesson period',
      },
    ],
  },
  {
    group: 'Residential',
    features: [
      {
        feature: Feature.BOARDING,
        label: 'Boarding Management',
        description: 'Hostel blocks, rooms, bed assignment',
      },
      {
        feature: Feature.POCKET_MONEY,
        label: 'Pocket Money',
        description: 'Student pocket money accounts and limits',
      },
      {
        feature: Feature.SICK_BAY,
        label: 'Sick Bay',
        description: 'Medical admissions and treatment tracking',
      },
      {
        feature: Feature.VISITOR_LOG,
        label: 'Visitor Log',
        description: 'Student visitor check-in/check-out',
      },
      {
        feature: Feature.MEAL_PLANS,
        label: 'Meal Plans',
        description: 'Full board, half board meal tracking',
      },
    ],
  },
  {
    group: 'Transport',
    features: [
      {
        feature: Feature.TRANSPORT,
        label: 'Transport Management',
        description: 'Routes, stops, vehicle assignment',
      },
      {
        feature: Feature.GPS_TRACKING,
        label: 'GPS Tracking',
        description: 'Real-time bus location for parents',
      },
    ],
  },
  {
    group: 'Library',
    features: [
      {
        feature: Feature.LIBRARY,
        label: 'Library Management',
        description: 'Book catalog, issues, returns, fines',
      },
      {
        feature: Feature.ELIBRARY,
        label: 'E-Library',
        description: 'Digital resources and e-books',
      },
    ],
  },
  {
    group: 'Add-ons',
    features: [
      {
        feature: Feature.SPORTS,
        label: 'Sports',
        description: 'Sports teams, fixtures, and results',
      },
      {
        feature: Feature.CANTEEN,
        label: 'Canteen',
        description: 'Meal ordering and canteen management',
      },
      {
        feature: Feature.ASSET_MANAGEMENT,
        label: 'Assets',
        description: 'School asset tracking and inventory',
      },
      {
        feature: Feature.AI_INSIGHTS,
        label: 'AI Insights',
        description: 'AI-powered analytics and predictions',
      },
      {
        feature: Feature.PTM_SCHEDULER,
        label: 'PTA Meetings',
        description: 'Parent-Teacher meeting scheduling',
      },
      {
        feature: Feature.WHATSAPP_NOTIFICATIONS,
        label: 'WhatsApp',
        description: 'WhatsApp notifications to parents',
      },
    ],
  },
] as const;
