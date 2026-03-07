'use client';

import { useConvexAuth } from 'convex/react';
import { ReactNode } from 'react';

/**
 * ISSUE-014 · AuthGuard Component
 *
 * Client component that protects routes by checking auth status.
 * Shows a loading skeleton while auth resolves to prevent flash of protected content.
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

  if (isLoading) {
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

  if (!isAuthenticated) {
    // Will be redirected by middleware — show nothing
    return null;
  }

  return <>{children}</>;
}
