import { PageHeader } from '@/components/shared/PageHeader';

/**
 * ISSUE-035 · Admin Dashboard Page
 * Role-aware dashboard with placeholder widgets.
 */
export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Welcome to EduZambia. Here's your school overview."
      />

      {/* Quick Stats Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-card rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Total Students</p>
          <p className="text-2xl font-semibold">–</p>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Staff Count</p>
          <p className="text-2xl font-semibold">–</p>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Today&apos;s Attendance</p>
          <p className="text-2xl font-semibold">–</p>
        </div>
        <div className="bg-card rounded-lg border p-4">
          <p className="text-muted-foreground text-sm">Outstanding Fees</p>
          <p className="text-2xl font-semibold">–</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-lg font-medium">Recent Activity</h2>
        <p className="text-muted-foreground mt-2 text-sm">
          Activity feed will be populated once modules are active.
        </p>
      </div>
    </div>
  );
}
