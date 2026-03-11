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
      <div className="flex min-h-screen">
        {/* Sidebar — hidden on mobile, shown on md+ */}
        <div className="hidden md:flex">
          <TeacherSidebar />
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
