import { cn } from '@/lib/utils';

/**
 * Shared LoadingSkeleton component.
 * A pulsing placeholder for content that hasn't loaded yet.
 */

interface LoadingSkeletonProps {
  className?: string;
  lines?: number;
}

export function LoadingSkeleton({ className, lines = 3 }: LoadingSkeletonProps) {
  return (
    <div className={cn('animate-pulse space-y-3', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className={cn('bg-muted h-4 rounded', i === lines - 1 ? 'w-2/3' : 'w-full')} />
      ))}
    </div>
  );
}

/**
 * Full-page loading skeleton used in AuthGuard and layouts.
 */
export function PageSkeleton() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-6 p-8">
        <div className="bg-muted mx-auto h-12 w-12 animate-pulse rounded-xl" />
        <LoadingSkeleton lines={4} />
      </div>
    </div>
  );
}
