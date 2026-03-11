import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardList,
  BookOpen,
  Calendar,
  CalendarDays,
  DollarSign,
  Building,
  Bus,
  Library,
  MonitorPlay,
  BarChart3,
  Settings,
  Bell,
  Palette,
  ToggleRight,
  UserCog,
  FileText,
  type LucideIcon,
} from 'lucide-react';
import { Feature } from '@/lib/features/flags';
import { Permission } from '@/lib/roles/types';

/**
 * ISSUE-026 · Admin Navigation Configuration
 *
 * The navigation is assembled at runtime — not hardcoded.
 * Each item can be gated by feature and/or permission.
 */
export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  requiredFeature?: Feature;
  requiredPermission?: Permission;
  children?: NavItem[];
  badge?: 'new' | 'beta';
}

export const adminNavConfig: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Students',
    href: '/students',
    icon: GraduationCap,
    requiredPermission: Permission.VIEW_STUDENTS,
  },
  {
    label: 'Staff',
    href: '/staff',
    icon: Users,
    requiredPermission: Permission.VIEW_STAFF,
  },
  {
    label: 'Attendance',
    href: '/attendance',
    icon: ClipboardList,
    requiredPermission: Permission.VIEW_ATTENDANCE,
  },
  {
    label: 'Academics',
    href: '/academics',
    icon: BookOpen,
    children: [
      {
        label: 'Subjects',
        href: '/academics/subjects',
        icon: BookOpen,
        requiredPermission: Permission.MANAGE_SCHOOL_SETTINGS,
      },
      {
        label: 'Grades',
        href: '/academics/grades',
        icon: GraduationCap,
        requiredPermission: Permission.MANAGE_SCHOOL_SETTINGS,
      },
      {
        label: 'Lesson Plans',
        href: '/academics/lesson-plans',
        icon: FileText,
      },
      {
        label: 'Homework',
        href: '/academics/homework',
        icon: BookOpen,
      },
    ],
  },
  {
    label: 'Exams',
    href: '/exams',
    icon: FileText,
    requiredPermission: Permission.VIEW_ALL_RESULTS,
  },
  {
    label: 'Fees & Finance',
    href: '/fees',
    icon: DollarSign,
    requiredPermission: Permission.VIEW_FINANCE_REPORTS,
  },
  {
    label: 'Boarding',
    href: '/boarding',
    icon: Building,
    requiredFeature: Feature.BOARDING,
    requiredPermission: Permission.MANAGE_HOSTELS,
  },
  {
    label: 'Transport',
    href: '/transport',
    icon: Bus,
    requiredFeature: Feature.TRANSPORT,
    requiredPermission: Permission.MANAGE_ROUTES,
  },
  {
    label: 'Library',
    href: '/library',
    icon: Library,
    requiredFeature: Feature.LIBRARY,
    requiredPermission: Permission.MANAGE_LIBRARY_CATALOG,
  },
  {
    label: 'LMS',
    href: '/lms',
    icon: MonitorPlay,
    requiredFeature: Feature.LMS,
    requiredPermission: Permission.CREATE_COURSE,
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: BarChart3,
    requiredPermission: Permission.VIEW_SCHOOL_ANALYTICS,
  },
  {
    label: 'Notifications',
    href: '/notifications',
    icon: Bell,
  },
];

export const adminSettingsNavConfig: NavItem[] = [
  {
    label: 'Academic Year',
    href: '/settings/academic-year',
    icon: Calendar,
    requiredPermission: Permission.MANAGE_SCHOOL_SETTINGS,
  },
  {
    label: 'School Calendar',
    href: '/settings/calendar',
    icon: CalendarDays,
    requiredPermission: Permission.MANAGE_SCHOOL_SETTINGS,
  },
  {
    label: 'Branding',
    href: '/settings/branding',
    icon: Palette,
    requiredPermission: Permission.MANAGE_SCHOOL_SETTINGS,
  },
  {
    label: 'Features',
    href: '/settings/features',
    icon: ToggleRight,
    requiredPermission: Permission.MANAGE_FEATURE_FLAGS,
  },
  {
    label: 'User Management',
    href: '/settings/users',
    icon: UserCog,
    requiredPermission: Permission.MANAGE_USERS,
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    requiredPermission: Permission.MANAGE_SCHOOL_SETTINGS,
  },
];
