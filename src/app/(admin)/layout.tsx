/**
 * Admin layout — sidebar + topbar shell.
 * ISSUE-032 · Admin Portal Shell
 */
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Topbar } from '@/components/layout/Topbar';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex min-h-screen">
        {/* Sidebar — hidden on mobile, shown on md+ */}
        <div className="hidden md:flex">
          <AdminSidebar />
        </div>
        <div className="flex flex-1 flex-col">
          <Topbar />
          <main role="main" className="flex-1 overflow-auto">
            <div className="p-4 md:p-6 lg:p-8">{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
