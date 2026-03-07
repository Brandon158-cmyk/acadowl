'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useMe } from '@/hooks/useMe';
import { SchoolLogo } from '@/components/school/SchoolLogo';
import {
  ChevronLeft,
  LogOut,
  LayoutDashboard,
  ClipboardList,
  BookOpen,
  Calendar,
  MessageSquare,
} from 'lucide-react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export function TeacherSidebar() {
  const pathname = usePathname();
  const me = useMe();
  const { signOut } = useAuthActions();
  const [collapsed, setCollapsed] = useState(false);

  const school = me?.school ?? null;
  const user = me?.user;
  const staff = me?.staff;

  const teacherNavConfig = [
    { label: 'Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard },
    { label: 'My Register', href: '/teacher/register', icon: ClipboardList },
    { label: 'My Marks', href: '/teacher/marks', icon: BookOpen },
    { label: 'Timetable', href: '/teacher/timetable', icon: Calendar },
    { label: 'LMS', href: '/teacher/lms', icon: BookOpen },
    { label: 'Messages', href: '/teacher/messages', icon: MessageSquare },
  ];

  return (
    <aside
      role="navigation"
      className={cn(
        'bg-sidebar border-sidebar-border flex flex-col border-r transition-all duration-200',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      <div className="flex items-center gap-3 p-4">
        <SchoolLogo school={school} size="sm" />
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="text-sidebar-foreground truncate text-sm font-semibold">
              {school?.shortName || school?.name || 'EduZambia'}
            </p>
            <p className="text-muted-foreground truncate text-xs">Teacher Portal</p>
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

      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {teacherNavConfig.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                collapsed && 'justify-center px-2',
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <Separator />

      {/* Staff Section Chips */}
      {!collapsed && staff?.classSectionId && (
        <div className="p-4">
          <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
            My Classes
          </p>
          <Badge variant="outline" className="mr-2 mb-2">
            Class Teacher
          </Badge>
        </div>
      )}

      {/* User Info + Sign Out */}
      <div className="p-3">
        {!collapsed && user && (
          <div className="mb-2 flex items-center gap-2">
            <div className="bg-primary/10 text-primary flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold">
              {(user.name || 'T').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name || 'Teacher'}</p>
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
