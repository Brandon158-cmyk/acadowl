'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button, buttonVariants } from '@/components/ui/button';
import { useAuthActions } from '@convex-dev/auth/react';
import { cn } from '@/lib/utils';
import { useConvexAuth } from 'convex/react';
import { useMe } from '@/hooks/useMe';
import { Loader2, UserPlus, LogOut } from 'lucide-react';
import Link from 'next/link';

/**
 * AuthLander Component
 *
 * Handles the "Where do I go now?" logic after login.
 * Redirects Platform Admins to /platform/dashboard and others to /dashboard.
 */
export function AuthLander() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const me = useMe();
  const router = useRouter();

  useEffect(() => {
    if (authLoading || me === undefined) return; // Still loading

    if (!isAuthenticated) {
      // Truly not logged in
      router.push('/login');
      return;
    }

    if (me === null) {
      // Authenticated at OIDC level, but no User record in Convex yet.
      // We stay here and show the "Complete Setup" UI instead of looping.
      return;
    }

    // Role-based routing
    if (me.user.role === 'platform_admin') {
      router.push('/platform/dashboard');
    } else {
      router.push('/dashboard');
    }
  }, [me, isAuthenticated, authLoading, router]);

  if (authLoading || me === undefined) {
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-4">
        <Loader2 className="text-primary h-10 w-10 animate-spin" />
        <p className="text-muted-foreground animate-pulse text-sm font-medium">
          Verifying your session...
        </p>
      </div>
    );
  }

  if (isAuthenticated && me === null) {
    return (
      <div className="flex h-screen flex-col items-center justify-center space-y-6 px-4 text-center">
        <div className="bg-muted flex h-20 w-20 items-center justify-center rounded-full">
          <UserPlus className="text-muted-foreground h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Account partially created</h1>
          <p className="text-muted-foreground max-w-xs">
            Your login is verified, but we couldn't find your profile record.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <Link href="/profile/setup" className={cn(buttonVariants({ variant: 'default' }))}>
            Complete Profile Setup
          </Link>
          <Button variant="outline" className="gap-2" onClick={() => signOut()}>
            <LogOut className="h-4 w-4" />
            Sign Out & Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center space-y-4">
      <Loader2 className="text-primary h-10 w-10 animate-spin" />
      <p className="text-muted-foreground animate-pulse text-sm font-medium">
        Redirecting to your dashboard...
      </p>
    </div>
  );
}
