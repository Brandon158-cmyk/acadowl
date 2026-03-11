'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function ParentDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Student Dashboard</h1>
      </div>

      {/* Child Summary Placeholder */}
      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-4">
        {/* Attendance Placeholder */}
        <Card>
          <CardContent className="p-4">
            <div className="text-muted-foreground mb-1 text-xs">Attendance</div>
            <Skeleton className="mb-2 h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>

        {/* Fees Placeholder */}
        <Card>
          <CardContent className="p-4">
            <div className="text-muted-foreground mb-1 text-xs">Fee Balance</div>
            <Skeleton className="mb-2 h-8 w-20" />
            <Skeleton className="h-3 w-20" />
          </CardContent>
        </Card>
      </div>

      {/* Recent Notifications */}
      <div className="space-y-4">
        <h2 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
          Recent Activity
        </h2>
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="mb-2 h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
