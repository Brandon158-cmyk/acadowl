/**
 * Admin layout — sidebar + topbar shell.
 * ISSUE-032 · Admin Portal Shell
 */
import { AuthGuard } from '@/components/auth/AuthGuard';
import { AdminSidebar } from '@/components/layout/AdminSidebar';
import { Topbar } from '@/components/layout/Topbar';
import { AdminSchoolProvider } from '@/providers/AdminSchoolProvider';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AdminSchoolProvider>
        <div className="flex h-screen overflow-hidden">
          {/* Sidebar — hidden on mobile, shown on md+ */}
          <div className="hidden shrink-0 md:flex">
            <AdminSidebar />
          </div>
          <div className="flex flex-1 flex-col overflow-hidden">
            <Topbar />
            <main role="main" className="flex-1 overflow-y-auto">
              <div className="p-4 md:p-6 lg:p-8">{children}</div>
            </main>
          </div>
        </div>
      </AdminSchoolProvider>
    </AuthGuard>
  );
}
