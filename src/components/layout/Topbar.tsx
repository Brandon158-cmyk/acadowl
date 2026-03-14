'use client';

import { useMe } from '@/hooks/useMe';
import { usePermission } from '@/hooks/usePermission';
import { Permission } from '@/lib/roles/types';
import { Bell, Calendar, MessageSquare, Menu, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

/**
 * ISSUE-032 · Topbar Component
 *
 * Shows: school name, academic year + term badge,
 * SMS credits (admin/bursar), notification bell, user dropdown.
 */

interface TopbarProps {
  onToggleMobileNav?: () => void;
}

export function Topbar({ onToggleMobileNav }: TopbarProps) {
  const me = useMe();
  const school = me?.school;
  const user = me?.user;

  // Notification count (reads identity internally, no args needed)
  const unreadCount = useQuery(api.notifications.queries.getUnreadCount);

  const canViewSMS = usePermission(Permission.SEND_BULK_SMS);

  return (
    <header className="sticky top-0 z-50 h-[60px] border-b bg-white px-4 md:px-6">
      <div className="flex h-full items-center gap-4">
        {/* Mobile hamburger */}
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onToggleMobileNav}>
          <Menu className="h-5 w-5" />
        </Button>

        {/* School Name Chip (md+) */}
        <div className="hidden items-center rounded-lg border bg-gray-50 px-3 py-1 md:flex">
          <span className="text-xs font-semibold text-gray-700">
            {school?.shortName || school?.name || 'EduZambia'}
          </span>
        </div>

        {/* Academic Year + Term Badge (Logic Preserved) */}
        {school?.currentTermId && (
          <Badge variant="outline" className="hidden shrink-0 items-center md:inline-flex">
            <Calendar className="mr-1 h-3 w-3" />
            {new Date().getFullYear()} · Active Term
          </Badge>
        )}

        <div className="flex-1" />

        {/* Center: Global Search Bar (md+) - Design Element */}
        <div className="relative hidden max-w-2xl flex-1 md:block">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search for something..."
            className="h-10 w-full rounded-full border-none bg-gray-100 pl-10 focus-visible:ring-1 focus-visible:ring-[#2D9B4E]"
          />
        </div>

        <div className="flex-1" />

        {/* SMS Balance (admin/bursar only) */}
        {canViewSMS && school && (
          <Badge variant="secondary" className="hidden md:inline-flex">
            <MessageSquare className="mr-1 h-3 w-3" />
            {school.smsBalance} SMS
          </Badge>
        )}

        {/* Notification Bell */}
        <Popover>
          <PopoverTrigger className="hover:bg-accent hover:text-accent-foreground relative inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors">
            <Bell className="h-5 w-5" />
            {typeof unreadCount === 'number' && unreadCount > 0 && (
              <span className="bg-destructive text-destructive-foreground absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </PopoverTrigger>
          <PopoverContent className="w-80 p-0" align="end">
            <div className="flex items-center justify-between border-b p-4">
              <h4 className="text-sm font-semibold">Notifications</h4>
              <Link href="/notifications" className="text-primary text-sm hover:underline">
                View all
              </Link>
            </div>
            <div className="text-muted-foreground p-4 text-center text-sm">
              {unreadCount === 0
                ? "You're all caught up!"
                : `You have ${unreadCount} unread message${unreadCount === 1 ? '' : 's'}.`}
            </div>
          </PopoverContent>
        </Popover>

        {/* User avatar / profile button */}
        {user && (
          <button className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E8F5ED] text-xs font-bold text-[#2D9B4E] transition-colors hover:bg-[#D7EDE0]">
            {(user.name || 'U').charAt(0).toUpperCase()}
          </button>
        )}
      </div>
    </header>
  );
}
