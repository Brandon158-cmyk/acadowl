'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useMe } from '@/hooks/useMe';
import { SchoolLogo } from '@/components/school/SchoolLogo';
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  LayoutDashboard,
  ClipboardList,
  BookOpen,
  Calendar,
  MessageSquare,
  Users,
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
  const staff = me?.staff;

  const teacherNavConfig = [
    { label: 'Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard },
    { label: 'My Class', href: '/teacher/my-class', icon: Users },
    { label: 'My Register', href: '/teacher/register', icon: ClipboardList },
    { label: 'My Marks', href: '/teacher/marks', icon: BookOpen },
    { label: 'Timetable', href: '/teacher/timetable', icon: Calendar },
    { label: 'LMS', href: '/teacher/lms', icon: BookOpen },
    { label: 'Messages', href: '/teacher/messages', icon: MessageSquare },
  ];

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
        <div className="flex h-16 shrink-0 items-center gap-3 px-4">
          <SchoolLogo school={school} size="sm" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">
              {school?.shortName || school?.name || 'EduZambia'}
            </p>
            <p className="truncate text-xs text-white/80">Teacher Portal</p>
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

        <nav className="sidebar-scroll flex-1 space-y-1 overflow-y-auto p-2">
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
                    ? 'bg-white/20 font-medium text-white'
                    : 'text-white/80 hover:bg-white/10 hover:text-white',
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <Separator className="bg-white/20" />

        {/* Staff Section Chips */}
        {staff?.classSectionId && (
          <div className="p-4">
            <p className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
              My Classes
            </p>
            <Badge variant="outline" className="mr-2 mb-2">
              Class Teacher
            </Badge>
          </div>
        )}

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
          className="fixed top-20 left-0 z-40 h-10 w-8 rounded-l-none border-l-0 bg-white text-[#2D8C3E] hover:bg-gray-50 hover:text-[#236B30]"
          onClick={() => setCollapsed(false)}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      )}
    </div>
  );
}
