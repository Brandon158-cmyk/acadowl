/**
 * Teacher layout — slim sidebar shell.
 * ISSUE-033 · Teacher Portal Shell
 */
import { AuthGuard } from '@/components/auth/AuthGuard';
import { TeacherSidebar } from '@/components/layout/TeacherSidebar';
import { Topbar } from '@/components/layout/Topbar';

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar — hidden on mobile, shown on md+ */}
        <div className="hidden shrink-0 md:flex">
          <TeacherSidebar />
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <Topbar />
          <main role="main" className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-6 lg:p-8">{children}</div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}
