'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { CheckCheck, Bell, Info, AlertTriangle, CheckCircle, CreditCard } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

function getIconForType(type: string) {
  switch (type.toLowerCase()) {
    case 'emergency':
      return <AlertTriangle className="text-destructive h-5 w-5" />;
    case 'fees':
      return <CreditCard className="h-5 w-5 text-amber-500" />;
    case 'attendance':
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    default:
      return <Info className="h-5 w-5 text-blue-500" />;
  }
}

export default function NotificationsPage() {
  const notifications = useQuery(api.notifications.queries.getMyNotifications, { limit: 50 });
  const markAllAsRead = useMutation(api.notifications.queries.markAllAsRead);
  const markAsRead = useMutation(api.notifications.queries.markAsRead);

  const hasUnread = notifications?.some((n) => !n.isRead);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Notifications" description="View your recent alerts and messages.">
        <Button
          variant="outline"
          disabled={!hasUnread || notifications === undefined}
          onClick={() => void markAllAsRead()}
        >
          <CheckCheck className="mr-2 h-4 w-4" />
          Mark all as read
        </Button>
      </PageHeader>

      <div className="space-y-3">
        {notifications === undefined ? (
          // Loading state
          [...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="flex gap-4 p-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : notifications.length === 0 ? (
          // Empty state
          <div className="rounded-lg border-2 border-dashed py-12 text-center">
            <Bell className="text-muted-foreground mx-auto mb-4 h-12 w-12 opacity-50" />
            <h3 className="text-lg font-medium">All caught up!</h3>
            <p className="text-muted-foreground mt-1">You don't have any new notifications.</p>
          </div>
        ) : (
          // List
          notifications.map((notif) => (
            <Card
              key={notif._id}
              className={cn(
                'transition-colors',
                !notif.isRead && 'border-l-primary bg-primary/5 border-l-4',
              )}
            >
              <CardContent className="flex items-start gap-4 p-4">
                <div className="bg-background mt-1 rounded-full border p-2 shadow-sm">
                  {getIconForType(notif.type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-4">
                    <p
                      className={cn(
                        'text-sm',
                        !notif.isRead
                          ? 'text-foreground font-semibold'
                          : 'text-foreground/80 font-medium',
                      )}
                    >
                      {notif.subject || 'Notification'}
                    </p>
                    <span className="text-muted-foreground text-xs whitespace-nowrap">
                      {formatDistanceToNow(notif.createdAt, { addSuffix: true })}
                    </span>
                  </div>
                  <p
                    className={cn(
                      'text-sm',
                      !notif.isRead ? 'text-foreground/90' : 'text-muted-foreground',
                    )}
                  >
                    {notif.body}
                  </p>
                </div>
                {!notif.isRead && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="shrink-0"
                    onClick={() => void markAsRead({ notificationId: notif._id })}
                  >
                    Mark read
                  </Button>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
