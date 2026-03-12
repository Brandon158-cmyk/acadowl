'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { usePermission } from '@/hooks/usePermission';
import { platformNavConfig, platformSettingsNavConfig } from '@/lib/navigation/platformNavConfig';
import type { NavItem } from '@/lib/navigation/adminNavConfig';
import { ChevronLeft, ChevronRight, LogOut, Shield } from 'lucide-react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export function PlatformSidebar() {
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
          'bg-linear-to-br from-[#2D8C3E] to-[#236B30]',
          collapsed ? '-translate-x-full' : 'translate-x-0',
        )}
      >
        {/* Platform Logo */}
        <div className="flex h-16 shrink-0 items-center gap-3 px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-white/20 font-bold text-white">
            <Shield className="h-4 w-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-white">EduZambia Platform</p>
            <p className="truncate text-xs text-white/80">Super Admin</p>
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
          {platformNavConfig.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}

          <Separator className="my-2 bg-white/20" />

          <div className="py-2">
            <p className="px-3 pb-2 text-[10px] font-semibold tracking-wider text-white/50 uppercase">
              Settings
            </p>
            {platformSettingsNavConfig.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>
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

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  // Permission gate
  const allowed = usePermission(item.requiredPermission);
  if (!allowed) return null;

  const Icon = item.icon;
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
        isActive
          ? 'bg-white/20 font-medium text-white'
          : 'text-white/80 hover:bg-white/10 hover:text-white',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="flex-1">{item.label}</span>
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
