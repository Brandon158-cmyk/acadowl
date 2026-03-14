'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useFeature } from '@/hooks/useFeature';
import { usePermission } from '@/hooks/usePermission';
import { adminNavConfig, type NavItem } from '@/lib/navigation/adminNavConfig';
import { Feature } from '@/lib/features/flags';
import { Permission } from '@/lib/roles/types';
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
  const { signOut } = useAuthActions();
  const [collapsed, setCollapsed] = useState(false);

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
          'bg-[#111827]', // Gray-900 per brand guidelines
          collapsed ? '-translate-x-full' : 'translate-x-0',
        )}
      >
        {/* Acadowl Logo + School Name */}
        <div className="flex h-16 shrink-0 items-center gap-3 px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#2D9B4E] font-bold text-white">
            Ac
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-jakarta truncate text-base font-semibold text-white">Acadowl</p>
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

        <Separator className="bg-gray-800" />

        {/* Main Nav */}
        <nav className="sidebar-scroll flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {adminNavConfig.map((item) => (
            <NavLink key={item.label} item={item} pathname={pathname} />
          ))}
        </nav>

        <Separator className="bg-gray-800" />

        {/* Sidebar Footer / Sign Out */}
        <div className="p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-[#9CA3AF] hover:bg-[#1F2937] hover:text-[#F9FAFB]"
            onClick={() => void signOut()}
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span className="ml-2">Sign Out</span>}
          </Button>
        </div>
      </aside>

      {/* Floating Expand Button */}
      {collapsed && (
        <Button
          variant="outline"
          size="icon"
          className="fixed top-20 left-0 z-40 h-10 w-8 rounded-l-none border-l-0 bg-white text-[#2D8C3E] hover:bg-gray-50 hover:text-[#236B30]"
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
            'flex h-10 w-full items-center gap-3 rounded-lg px-3 transition-all duration-150',
            isExactActive
              ? 'bg-[#2D9B4E] font-semibold text-white'
              : isChildActive
                ? 'font-medium text-white'
                : 'text-[#9CA3AF] hover:bg-[#1F2937] hover:text-[#F9FAFB]',
            isChild && 'pl-9',
          )}
        >
          <Icon
            className={cn(
              'h-[18px] w-[18px] shrink-0',
              isExactActive || isChildActive ? 'text-white' : 'text-[#6B7280]',
            )}
          />
          <span className="font-jakarta flex-1 text-left text-sm">{item.label}</span>
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
        'flex h-10 items-center gap-3 rounded-lg px-3 transition-all duration-150',
        isExactActive
          ? 'bg-[#2D9B4E] font-semibold text-white'
          : 'text-[#9CA3AF] hover:bg-[#1F2937] hover:text-[#F9FAFB]',
        isChild && 'pl-9',
      )}
    >
      <Icon
        className={cn(
          'h-[18px] w-[18px] shrink-0',
          isExactActive ? 'text-white' : 'text-[#6B7280]',
        )}
      />
      <span className="font-jakarta flex-1 text-left text-sm">{item.label}</span>
      {item.badge && (
        <Badge
          className={cn(
            'h-[18px] min-w-[18px] px-1 text-[10px] font-bold',
            item.badge === 'new' ? 'bg-[#DC2626] text-white' : 'bg-gray-700 text-gray-300',
          )}
        >
          {item.badge}
        </Badge>
      )}
    </Link>
  );
}
