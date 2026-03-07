/**
 * Platform layout — sidebar + topbar shell.
 * ISSUE-032 · Platform Portal Shell
 */
import { AuthGuard } from '@/components/auth/AuthGuard';
import { PlatformSidebar } from '@/components/layout/PlatformSidebar';
import { PlatformTopbar } from '@/components/layout/PlatformTopbar';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { Permission } from '@/lib/roles/types';

export default function PlatformLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <PermissionGuard permission={Permission.MANAGE_ALL_SCHOOLS}>
        <div className="flex min-h-screen">
          {/* Sidebar — hidden on mobile, shown on md+ */}
          <div className="hidden md:flex">
            <PlatformSidebar />
          </div>
          <div className="flex flex-1 flex-col">
            <PlatformTopbar />
            <main role="main" className="flex-1 overflow-auto">
              <div className="p-4 md:p-6 lg:p-8">{children}</div>
            </main>
          </div>
        </div>
      </PermissionGuard>
    </AuthGuard>
  );
}
