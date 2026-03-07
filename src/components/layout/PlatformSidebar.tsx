'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useMe } from '@/hooks/useMe';
import { usePermission } from '@/hooks/usePermission';
import { platformNavConfig, platformSettingsNavConfig } from '@/lib/navigation/platformNavConfig';
import type { NavItem } from '@/lib/navigation/adminNavConfig';
import { ChevronLeft, LogOut, Shield } from 'lucide-react';
import { useAuthActions } from '@convex-dev/auth/react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export function PlatformSidebar() {
  const pathname = usePathname();
  const me = useMe();
  const { signOut } = useAuthActions();
  const [collapsed, setCollapsed] = useState(false);

  const user = me?.user;

  return (
    <aside
      role="navigation"
      className={cn(
        'flex flex-col border-r border-slate-800 bg-slate-900 text-slate-100 transition-all duration-200',
        collapsed ? 'w-16' : 'w-64',
      )}
    >
      {/* Platform Logo */}
      <div className="flex items-center gap-3 p-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-600 font-bold text-white">
          <Shield className="h-4 w-4" />
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">EduZambia Platform</p>
            <p className="truncate text-xs text-slate-400">Super Admin</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="ml-auto h-7 w-7 shrink-0 text-slate-400 hover:bg-slate-800 hover:text-white"
          onClick={() => setCollapsed(!collapsed)}
        >
          <ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} />
        </Button>
      </div>

      <Separator className="bg-slate-800" />

      {/* Main Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {platformNavConfig.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} />
        ))}
      </nav>

      <Separator className="bg-slate-800" />

      {/* Settings Nav */}
      <div className="space-y-1 p-2">
        {platformSettingsNavConfig.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} collapsed={collapsed} />
        ))}
      </div>

      <Separator className="bg-slate-800" />

      {/* User Info + Sign Out */}
      <div className="p-3">
        {!collapsed && user && (
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
              {(user.name || 'A').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-200">{user.name || 'Admin'}</p>
              <Badge
                variant="secondary"
                className="border-none bg-blue-900/50 text-[10px] text-blue-200 hover:bg-blue-900/50"
              >
                {user.role?.replace('_', ' ') || 'Platform Admin'}
              </Badge>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size={collapsed ? 'icon' : 'sm'}
          className={cn(
            'w-full text-slate-400 hover:bg-slate-800 hover:text-white',
            !collapsed && 'justify-start',
          )}
          onClick={() => void signOut()}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sign Out</span>}
        </Button>
      </div>
    </aside>
  );
}

function NavLink({
  item,
  pathname,
  collapsed,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
}) {
  // Permission gate
  if (item.requiredPermission) {
    const allowed = usePermission(item.requiredPermission);
    if (!allowed) return null;
  }

  const Icon = item.icon;
  // Ensure we highlight correctly for platform routes. Assuming platform is hosted on a subdomain but accessed directly,
  // or it shares the same app/ structure. Wait, `(platform)` means it's available at root, but middleware routes it.
  // Actually, in `(platform)/schools/new`, the path is `/schools/new`.
  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
        isActive
          ? 'bg-blue-600 font-medium text-white'
          : 'text-slate-400 hover:bg-slate-800 hover:text-white',
        collapsed && 'justify-center px-2',
      )}
      title={collapsed ? item.label : undefined}
    >
      <Icon className="h-4 w-4 shrink-0" />
      {!collapsed && (
        <>
          <span className="flex-1">{item.label}</span>
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
