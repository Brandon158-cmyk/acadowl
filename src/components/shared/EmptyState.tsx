import { cn } from '@/lib/utils';

/**
 * Shared EmptyState component for pages/sections with no data.
 */
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center',
        className,
      )}
    >
      {icon && <div className="text-muted-foreground mb-4">{icon}</div>}
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-muted-foreground mt-1 text-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
