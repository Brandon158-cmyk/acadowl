'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useMe } from '@/hooks/useMe';
import { useFeature } from '@/hooks/useFeature';
import { usePermission } from '@/hooks/usePermission';
import {
  adminNavConfig,
  adminSettingsNavConfig,
  type NavItem,
} from '@/lib/navigation/adminNavConfig';
import { Feature } from '@/lib/features/flags';
import { Permission } from '@/lib/roles/types';
import { SchoolLogo } from '@/components/school/SchoolLogo';
import { ChevronLeft, LogOut, ChevronDown } from 'lucide-react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

/**
 * ISSUE-032 · Admin Portal Sidebar
 *
 * Feature-gated and role-gated navigation.
 * Collapsible on desktop, drawer on mobile.
 */
export function AdminSidebar() {
  const pathname = usePathname();
  const me = useMe();
  const { signOut } = useAuthActions();
  const [collapsed, setCollapsed] = useState(false);

  const school = me?.school ?? null;
  const user = me?.user;

  return (
    <aside
      role="navigation"
      className={cn(
        'bg-sidebar border-sidebar-border flex flex-col border-r transition-all duration-200',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* School Logo + Name */}
      <div className="flex items-center gap-3 p-4">
        <SchoolLogo school={school} size="md" />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-sidebar-foreground truncate text-sm font-semibold">
              {school?.shortName || school?.name || 'EduZambia'}
            </p>
            {school?.branding?.motto && (
              <p className="text-muted-foreground truncate text-xs">{school.branding.motto}</p>
            )}
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto h-7 w-7 shrink-0"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
        </Button>
      </div>

      <Separator />

      {/* Main Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {adminNavConfig.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} />
        ))}
      </nav>

      <Separator />

      {/* Settings Nav */}
      <div className="space-y-1 p-2">
        {adminSettingsNavConfig.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} />
        ))}
      </div>

      <Separator />

      {/* User Info + Sign Out */}
      <div className="p-3">
        {!collapsed && user && (
          <div className="mb-2 flex items-center gap-2">
            <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold">
              {(user.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name || 'User'}</p>
              <Badge variant="secondary" className="text-[10px]">
                {user.role?.replace('_', ' ') || 'Unknown'}
              </Badge>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'sm'}
          className={cn('text-muted-foreground w-full', !collapsed && 'justify-start')}
          onClick={() => void signOut()}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sign Out</span>}
        </Button>
      </div>
    </aside>
  );
}

/**
 * Individual nav link with feature + permission gating.
 */
function NavLink({
  item,
  pathname,
  collapsed,
  isChild = false,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  isChild?: boolean;
}) {
  // Unconditional hook calls to obey Rules of Hooks
  const enabled = useFeature(item.requiredFeature as Feature);
  const allowed = usePermission(item.requiredPermission as Permission);

  const isActive =
    pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'));
  const [isOpen, setIsOpen] = useState(isActive);

  // Feature gate
  if (item.requiredFeature && !enabled) {
    return null;
  }

  // Permission gate
  if (item.requiredPermission && !allowed) {
    return null;
  }

  const Icon = item.icon;

  if (item.children && item.children.length > 0) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
            isActive
              ? 'bg-primary/5 text-primary font-medium'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
            collapsed && 'justify-center px-2',
            isChild && !collapsed && 'pl-9',
          )}
          title={collapsed ? item.label : undefined}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {!collapsed && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              <ChevronDown
                className={cn('h-4 w-4 shrink-0 transition-transform', isOpen && 'rotate-180')}
              />
            </>
          )}
        </button>
        {isOpen && !collapsed && (
          <div className="space-y-1">
            {item.children.map((child) => (
              <NavLink
                key={child.href}
                item={child}
                pathname={pathname}
                collapsed={collapsed}
                isChild
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isExactActive = pathname === item.href;

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
        isExactActive
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
        collapsed && 'justify-center px-2',
        isChild && !collapsed && 'pl-9',
      )}
      title={collapsed ? item.label : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1 text-left">{item.label}</span>
          {item.badge && (
            <Badge variant={item.badge === 'new' ? 'default' : 'secondary'} className="text-[10px]">
              {item.badge}
            </Badge>
          )}
        </>
      )}
    </Link>
  );
}
