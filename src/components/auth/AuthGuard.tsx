'use client';

import { useConvexAuth } from 'convex/react';
import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * ISSUE-014 · AuthGuard Component
 *
 * Client component that protects routes by checking auth status.
 * Shows a loading skeleton while auth resolves to prevent flash of protected content.
 * Redirects to /login if the user is unauthenticated.
 *
 * @example
 * <AuthGuard>
 *   <ProtectedContent />
 * </AuthGuard>
 */
interface AuthGuardProps {
  children: ReactNode;
  loadingFallback?: ReactNode;
}

export function AuthGuard({ children, loadingFallback }: AuthGuardProps) {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <>
        {loadingFallback ?? (
          <div className="flex h-screen items-center justify-center">
            <div className="border-muted border-t-primary h-8 w-8 animate-spin rounded-full border-4" />
          </div>
        )}
      </>
    );
  }

  return <>{children}</>;
}
