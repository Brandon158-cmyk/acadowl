import { cn } from '@/lib/utils';

/**
 * Shared PageHeader component used across all pages.
 * Provides consistent spacing and typography for page titles.
 */
interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between',
        className,
      )}
    >
      <div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-[#111827]">
          {title}
        </h1>
        {description && <p className="mt-1 text-[14px] text-[#6B7280]">{description}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
