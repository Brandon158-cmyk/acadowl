/**
 * Parent layout — mobile-first bottom tab shell.
 * ISSUE-034 · Parent Portal Shell
 */
import { AuthGuard } from '@/components/auth/AuthGuard';
import { ParentShell } from '@/components/layout/ParentShell';

export default function ParentLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <ParentShell>{children}</ParentShell>
    </AuthGuard>
  );
}
