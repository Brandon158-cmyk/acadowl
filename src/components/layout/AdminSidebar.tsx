'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useMe } from '@/hooks/useMe';
import { useFeature } from '@/hooks/useFeature';
import { usePermission } from '@/hooks/usePermission';
import { adminNavConfig, type NavItem } from '@/lib/navigation/adminNavConfig';
import { Feature } from '@/lib/features/flags';
import { Permission } from '@/lib/roles/types';
import { SchoolLogo } from '@/components/school/SchoolLogo';
import { ChevronLeft, ChevronRight, LogOut, ChevronDown } from 'lucide-react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

/**
 * ISSUE-032 · Admin Portal Sidebar
 *
 * Feature-gated and role-gated navigation.
 * Fully collapsible on desktop to w-0, opening back out to w-240px.
 */
export function AdminSidebar() {
  const pathname = usePathname();
  const me = useMe();
  const { signOut } = useAuthActions();
  const [collapsed, setCollapsed] = useState(false);

  const school = me?.school ?? null;
  return (
    <div
      className={cn(
        'relative h-full shrink-0 transition-all duration-300',
        collapsed ? 'w-0' : 'w-[240px]',
      )}
    >
      <aside
        role="navigation"
        className={cn(
          'absolute inset-y-0 left-0 z-30 flex w-[240px] flex-col text-white transition-transform duration-300',
          'bg-linear-to-br from-[#2D8C3E] to-[#236B30]',
          collapsed ? '-translate-x-full' : 'translate-x-0',
        )}
      >
        {/* School Logo + Name */}
        <div className="flex h-16 shrink-0 items-center gap-3 px-4">
          <SchoolLogo school={school} size="md" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {school?.shortName || school?.name || 'EduZambia'}
            </p>
            {school?.branding?.motto && (
              <p className="truncate text-xs text-white/80">{school.branding.motto}</p>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="ml-auto h-7 w-7 shrink-0 text-white/80 hover:bg-white/10 hover:text-white"
            onClick={() => setCollapsed(true)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>

        <Separator className="bg-white/20" />

        {/* Main Nav */}
        <nav className="sidebar-scroll flex-1 space-y-1 overflow-y-auto p-2">
          {adminNavConfig.map((item) => (
            <NavLink key={item.label} item={item} pathname={pathname} />
          ))}
        </nav>

        <Separator className="bg-white/20" />

        {/* Sign Out */}
        <div className="p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-white/80 hover:bg-white/10 hover:text-white"
            onClick={() => void signOut()}
          >
            <LogOut className="h-4 w-4" />
            <span className="ml-2">Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Floating Expand Button */}
      {collapsed && (
        <Button
          variant="outline"
          size="icon"
          className="fixed top-20 left-0 z-40 h-10 w-8 rounded-l-none border-l-0 bg-white text-[#2D8C3E] shadow-md hover:bg-gray-50 hover:text-[#236B30]"
          onClick={() => setCollapsed(false)}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}

/**
 * Individual nav link with feature + permission gating.
 */
function NavLink({
  item,
  pathname,
  isChild = false,
}: {
  item: NavItem;
  pathname: string;
  isChild?: boolean;
}) {
  const enabled = useFeature(item.requiredFeature as Feature);
  const allowed = usePermission(item.requiredPermission as Permission);

  // Consider it active if exact match, or if an item in children is active
  const isExactActive = pathname === item.href;
  const isChildActive =
    item.children?.some((c) => pathname.startsWith(c.href)) || pathname.startsWith(item.href + '/');
  const isActive = isExactActive || isChildActive;

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
              ? 'bg-white/20 font-medium text-white'
              : 'text-white/80 hover:bg-white/10 hover:text-white',
            isChild && 'pl-9',
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="flex-1 text-left">{item.label}</span>
          <ChevronDown
            className={cn('h-4 w-4 shrink-0 transition-transform', isOpen && 'rotate-180')}
          />
        </button>
        {isOpen && (
          <div className="space-y-1 pb-1">
            {item.children.map((child) => (
              <NavLink key={child.label} item={child} pathname={pathname} isChild />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
        isExactActive
          ? 'bg-white/20 font-medium text-white'
          : 'text-white/80 hover:bg-white/10 hover:text-white',
        isChild && 'pl-9',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1 text-left">{item.label}</span>
      {item.badge && (
        <Badge
          variant={item.badge === 'new' ? 'default' : 'secondary'}
          className={cn(
            'text-[10px]',
            item.badge !== 'new' && 'border-transparent bg-white/20 text-white hover:bg-white/30',
          )}
        >
          {item.badge}
        </Badge>
      )}
    </Link>
  );
}
