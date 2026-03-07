import {
  LayoutDashboard,
  Users,
  GraduationCap,
  ClipboardList,
  BookOpen,
  Calendar,
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
    href: '/(admin)/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'Students',
    href: '/(admin)/students',
    icon: GraduationCap,
    requiredPermission: Permission.VIEW_STUDENTS,
  },
  {
    label: 'Staff',
    href: '/(admin)/staff',
    icon: Users,
    requiredPermission: Permission.VIEW_STAFF,
  },
  {
    label: 'Attendance',
    href: '/(admin)/attendance',
    icon: ClipboardList,
    requiredPermission: Permission.VIEW_ATTENDANCE,
  },
  {
    label: 'Academics',
    href: '/(admin)/academics',
    icon: BookOpen,
  },
  {
    label: 'Exams',
    href: '/(admin)/exams',
    icon: FileText,
    requiredPermission: Permission.VIEW_ALL_RESULTS,
  },
  {
    label: 'Fees & Finance',
    href: '/(admin)/fees',
    icon: DollarSign,
    requiredPermission: Permission.VIEW_FINANCE_REPORTS,
  },
  {
    label: 'Boarding',
    href: '/(admin)/boarding',
    icon: Building,
    requiredFeature: Feature.BOARDING,
    requiredPermission: Permission.MANAGE_HOSTELS,
  },
  {
    label: 'Transport',
    href: '/(admin)/transport',
    icon: Bus,
    requiredFeature: Feature.TRANSPORT,
    requiredPermission: Permission.MANAGE_ROUTES,
  },
  {
    label: 'Library',
    href: '/(admin)/library',
    icon: Library,
    requiredFeature: Feature.LIBRARY,
    requiredPermission: Permission.MANAGE_LIBRARY_CATALOG,
  },
  {
    label: 'LMS',
    href: '/(admin)/lms',
    icon: MonitorPlay,
    requiredFeature: Feature.LMS,
    requiredPermission: Permission.CREATE_COURSE,
  },
  {
    label: 'Reports',
    href: '/(admin)/reports',
    icon: BarChart3,
    requiredPermission: Permission.VIEW_SCHOOL_ANALYTICS,
  },
  {
    label: 'Notifications',
    href: '/(admin)/notifications',
    icon: Bell,
  },
];

export const adminSettingsNavConfig: NavItem[] = [
  {
    label: 'Branding',
    href: '/(admin)/settings/branding',
    icon: Palette,
    requiredPermission: Permission.MANAGE_SCHOOL_SETTINGS,
  },
  {
    label: 'Features',
    href: '/(admin)/settings/features',
    icon: ToggleRight,
    requiredPermission: Permission.MANAGE_FEATURE_FLAGS,
  },
  {
    label: 'User Management',
    href: '/(admin)/settings/users',
    icon: UserCog,
    requiredPermission: Permission.MANAGE_USERS,
  },
  {
    label: 'Settings',
    href: '/(admin)/settings',
    icon: Settings,
    requiredPermission: Permission.MANAGE_SCHOOL_SETTINGS,
  },
];
