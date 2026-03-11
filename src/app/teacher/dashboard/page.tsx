'use client';

import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useMe } from '@/hooks/useMe';
import { format } from 'date-fns';

export default function TeacherDashboardPage() {
  const me = useMe();
  const userName = me?.user?.name?.split(' ')[0] || 'Teacher';

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <PageHeader
        title={`Good morning, ${userName}`}
        description={`${format(new Date(), 'EEEE, MMMM do yyyy')}`}
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Timetable Placeholder */}
        <Card className="col-span-1 md:col-span-2">
          <CardHeader>
            <CardTitle>Today's Timetable</CardTitle>
            <CardDescription>Your classes for today</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-16 rounded" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Action Items */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Pending Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-12 w-full rounded" />
            <Skeleton className="h-12 w-full rounded" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
