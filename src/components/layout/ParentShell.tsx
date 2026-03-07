'use client';

import { useMe } from '@/hooks/useMe';
import { SchoolLogo } from '@/components/school/SchoolLogo';
import { Home, Calendar, FileText, CreditCard, Menu, UserCircle, LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useAuthActions } from '@convex-dev/auth/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ParentShell({ children }: { children: React.ReactNode }) {
  const me = useMe();
  const pathname = usePathname();
  const { signOut } = useAuthActions();

  const school = me?.school;
  const user = me?.user;
  const guardianProfiles = me?.guardianProfiles || [];

  const navItems = [
    { label: 'Home', href: '/parent/dashboard', icon: Home },
    { label: 'Attendance', href: '/parent/attendance', icon: Calendar },
    { label: 'Results', href: '/parent/results', icon: FileText },
    { label: 'Fees', href: '/parent/fees', icon: CreditCard },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      {/* Topbar */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3 shadow-sm">
        <SchoolLogo school={school ?? null} size="sm" />

        {/* Child Switcher Placeholder */}
        {guardianProfiles.length > 0 && guardianProfiles[0].children?.length > 0 && (
          <div className="w-48">
            <Select defaultValue={guardianProfiles[0].children[0]._id}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Select child" />
              </SelectTrigger>
              <SelectContent>
                {guardianProfiles.flatMap(
                  (gp) =>
                    // In a real app we'd group by school here if multi-school
                    gp.children?.map((child: any) => (
                      <SelectItem key={child._id} value={child._id} className="text-xs">
                        {child.firstName} {child.lastName}
                      </SelectItem>
                    )) || [],
                )}
              </SelectContent>
            </Select>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main role="main" className="flex-1 overflow-auto pb-16">
        <div className="mx-auto max-w-screen-sm p-4 md:p-6">{children}</div>
      </main>

      {/* Bottom Tab Bar (Mobile First) */}
      <nav className="pb-safe fixed right-0 bottom-0 left-0 z-10 border-t bg-white px-2">
        <div className="mx-auto flex h-16 max-w-screen-sm items-center justify-around">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex h-full w-full flex-col items-center justify-center space-y-1 text-xs',
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className={cn('h-5 w-5', isActive && 'fill-primary/20')} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <Sheet>
            <SheetTrigger className="text-muted-foreground hover:text-foreground relative flex h-full w-full flex-col items-center justify-center space-y-1 text-xs">
              <Menu className="h-5 w-5" />
              <span>More</span>
            </SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] rounded-t-xl px-0 pb-0">
              <SheetHeader className="border-b px-6 pb-4 text-left">
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>

              <div className="space-y-1 overflow-y-auto p-4">
                {user && (
                  <div className="bg-muted/50 mb-4 flex items-center gap-3 rounded-lg p-3">
                    <UserCircle className="text-muted-foreground h-10 w-10" />
                    <div>
                      <p className="text-sm font-medium">{user.name}</p>
                      <p className="text-muted-foreground text-xs">{user.phone}</p>
                    </div>
                  </div>
                )}

                <Link
                  href="/parent/messages"
                  className="hover:bg-muted flex items-center gap-3 rounded-md p-3 text-sm"
                >
                  <span className="flex-1">Messages</span>
                </Link>
                <Link
                  href="/parent/transport"
                  className="hover:bg-muted flex items-center gap-3 rounded-md p-3 text-sm"
                >
                  <span className="flex-1">Transport & GPS</span>
                </Link>
                <Link
                  href="/parent/profile"
                  className="hover:bg-muted flex items-center gap-3 rounded-md p-3 text-sm"
                >
                  <span className="flex-1">My Profile</span>
                </Link>

                <div className="mt-8 border-t px-3 pt-4">
                  <Button variant="destructive" className="w-full" onClick={() => void signOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </nav>
    </div>
  );
}
