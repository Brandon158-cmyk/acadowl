/**
 * Auth layout — minimal, branded wrapper for login/register pages.
 * No sidebar, no topbar. Just a centered card with school branding.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/40 flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">{children}</div>
      <p className="text-muted-foreground mt-8 text-xs">
        Powered by <span className="font-medium">EduZambia</span>
      </p>
    </div>
  );
}
