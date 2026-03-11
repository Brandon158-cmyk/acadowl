import { Building2, LayoutDashboard, Settings, Users, Activity } from 'lucide-react';
import { Permission } from '@/lib/roles/types';
import type { NavItem } from './adminNavConfig';

export const platformNavConfig: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/platform/dashboard',
    icon: LayoutDashboard,
    requiredPermission: Permission.VIEW_PLATFORM_ANALYTICS,
  },
  {
    label: 'Schools',
    href: '/platform/schools',
    icon: Building2,
    requiredPermission: Permission.MANAGE_ALL_SCHOOLS,
  },
  {
    label: 'Platform Users',
    href: '/platform/users',
    icon: Users,
    requiredPermission: Permission.MANAGE_ALL_SCHOOLS,
  },
  {
    label: 'System Logs',
    href: '/platform/logs',
    icon: Activity,
    requiredPermission: Permission.MANAGE_ALL_SCHOOLS,
  },
];

export const platformSettingsNavConfig: NavItem[] = [
  {
    label: 'Global Settings',
    href: '/platform/settings',
    icon: Settings,
    requiredPermission: Permission.MANAGE_ALL_SCHOOLS,
  },
];
