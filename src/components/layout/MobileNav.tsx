'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { adminNavConfig, type NavItem } from '@/lib/navigation/adminNavConfig';
import { useFeature } from '@/hooks/useFeature';
import { usePermission } from '@/hooks/usePermission';
import { Feature } from '@/lib/features/flags';
import { Permission } from '@/lib/roles/types';

/**
 * ISSUE-032 · MobileNav Component
 *
 * Drawer-style navigation for mobile admin view.
 */

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)}>
        <Menu className="h-5 w-5" />
      </Button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="bg-background absolute inset-y-0 left-0 w-72 p-4 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-semibold">Navigation</p>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <nav className="space-y-1">
              {adminNavConfig.map((item) => (
                <MobileNavLink
                  key={item.href}
                  item={item}
                  pathname={pathname}
                  onNavigate={() => setOpen(false)}
                />
              ))}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}

function MobileNavLink({
  item,
  pathname,
  onNavigate,
  isChild = false,
}: {
  item: NavItem;
  pathname: string;
  onNavigate: () => void;
  isChild?: boolean;
}) {
  const enabled = useFeature(item.requiredFeature as Feature);
  const allowed = usePermission(item.requiredPermission as Permission);

  const isActive =
    pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/'));
  const [isOpen, setIsOpen] = useState(isActive);

  if (item.requiredFeature && !enabled) return null;
  if (item.requiredPermission && !allowed) return null;

  const Icon = item.icon;

  if (item.children && item.children.length > 0) {
    return (
      <div className="space-y-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
            isActive
              ? 'bg-primary/5 text-primary font-medium'
              : 'text-muted-foreground hover:bg-accent',
            isChild && 'pl-9',
          )}
        >
          <div className="flex items-center gap-3">
            <Icon className="h-4 w-4 shrink-0" />
            <span className="text-left">{item.label}</span>
          </div>
          <ChevronDown
            className={cn('h-4 w-4 shrink-0 transition-transform', isOpen && 'rotate-180')}
          />
        </button>
        {isOpen && (
          <div className="space-y-1 py-1">
            {item.children.map((child) => (
              <MobileNavLink
                key={child.href}
                item={child}
                pathname={pathname}
                onNavigate={onNavigate}
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
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors',
        isExactActive
          ? 'bg-primary/10 text-primary font-medium'
          : 'text-muted-foreground hover:bg-accent',
        isChild && 'pl-9',
      )}
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span className="text-left">{item.label}</span>
    </Link>
  );
}
