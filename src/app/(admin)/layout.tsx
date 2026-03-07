/**
 * Admin layout — sidebar + topbar shell.
 * ISSUE-032 · Admin Portal Shell
 *
 * Uses the dashboard-01 block pattern from shadcn as a base.
 */
import { AuthGuard } from '@/components/auth/AuthGuard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        {/* Sidebar will be built in ISSUE-032 */}
        <main className="flex-1 overflow-auto">
          <div className="p-4 md:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </AuthGuard>
  );
}
