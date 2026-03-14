'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  XCircle,
  Clock,
  CalendarOff,
  Save,
  Users,
  UserCheck,
  UserX,
  AlertTriangle,
} from 'lucide-react';
import { Id } from '../../../../../convex/_generated/dataModel';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ── ISSUE-060 · Staff Attendance Register Page ──

type AttendanceStatus = 'present' | 'absent' | 'on_leave' | 'late';

interface StaffEntry {
  staffId: Id<'staff'>;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  jobTitle: string;
  staffCategory: string;
  status: AttendanceStatus | null;
  leaveType: string | null;
  notes: string | null;
  attendanceId: string | null;
}

const STATUS_CONFIG: Record<
  AttendanceStatus,
  { label: string; color: string; bgColor: string; icon: typeof CheckCircle2 }
> = {
  present: {
    label: 'Present',
    color: 'text-[#2D9B4E]',
    bgColor: 'bg-[#E8F5ED] ring-[#2D9B4E]/20',
    icon: CheckCircle2,
  },
  absent: {
    label: 'Absent',
    color: 'text-[#DC2626]',
    bgColor: 'bg-[#FEF2F2] ring-[#DC2626]/20',
    icon: XCircle,
  },
  late: {
    label: 'Late',
    color: 'text-[#D97706]',
    bgColor: 'bg-[#FFFBEB] ring-[#D97706]/20',
    icon: Clock,
  },
  on_leave: {
    label: 'On Leave',
    color: 'text-[#2563EB]',
    bgColor: 'bg-[#EFF6FF] ring-[#2563EB]/20',
    icon: CalendarOff,
  },
};

function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function StaffAttendancePage() {
  const [selectedDate, setSelectedDate] = useState(() => formatDate(new Date()));
  const [localStatuses, setLocalStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [localNotes, setLocalNotes] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const staffAttendance = useQuery(api.staff.staffAttendance.getStaffAttendanceByDate, {
    date: selectedDate,
  });
  const summary = useQuery(api.staff.staffAttendance.getStaffAttendanceSummary, {
    date: selectedDate,
  });
  const markBulk = useMutation(api.staff.staffAttendance.markBulkStaffAttendance);

  // Initialize local statuses from server data
  const staffList: StaffEntry[] = useMemo(() => {
    if (!staffAttendance) return [];
    return staffAttendance as StaffEntry[];
  }, [staffAttendance]);

  // Get effective status (local override or server value)
  const getStatus = (staffId: string): AttendanceStatus | null => {
    return localStatuses[staffId] ?? staffList.find((s) => s.staffId === staffId)?.status ?? null;
  };

  const setStaffStatus = (staffId: string, status: AttendanceStatus) => {
    setLocalStatuses((prev) => ({ ...prev, [staffId]: status }));
  };

  const setStaffNotes = (staffId: string, notes: string) => {
    setLocalNotes((prev) => ({ ...prev, [staffId]: notes }));
  };

  // Filter by category
  const filteredStaff = staffList.filter(
    (s) => filterCategory === 'all' || s.staffCategory === filterCategory,
  );

  // Check if there are unsaved changes
  const hasChanges = Object.keys(localStatuses).length > 0 || Object.keys(localNotes).length > 0;

  // Mark all present
  const markAllPresent = () => {
    const updates: Record<string, AttendanceStatus> = {};
    for (const s of filteredStaff) {
      if (!getStatus(s.staffId)) {
        updates[s.staffId] = 'present';
      }
    }
    setLocalStatuses((prev) => ({ ...prev, ...updates }));
  };

  // Save all
  const handleSave = async () => {
    if (!hasChanges) return;
    setIsSaving(true);
    try {
      const allStaffIds = [
        ...new Set([...Object.keys(localStatuses), ...Object.keys(localNotes)]),
      ];
      const entries = allStaffIds.map((staffId) => ({
        staffId: staffId as Id<'staff'>,
        status: localStatuses[staffId] ?? getStatus(staffId) ?? ('present' as AttendanceStatus),
        notes: localNotes[staffId] || undefined,
      }));

      await markBulk({ date: selectedDate, entries });
      toast.success(`Attendance saved for ${entries.length} staff member${entries.length !== 1 ? 's' : ''}.`);
      setLocalStatuses({});
      setLocalNotes({});
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save attendance.';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  // Navigate date
  const prevDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    setSelectedDate(formatDate(d));
    setLocalStatuses({});
    setLocalNotes({});
  };
  const nextDay = () => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + 1);
    setSelectedDate(formatDate(d));
    setLocalStatuses({});
    setLocalNotes({});
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-10">
      {/* Header */}
      <div className="space-y-1">
        <div className="mb-1 flex items-center gap-2 text-sm font-medium text-[#2D9B4E]">
          <span>Staff</span>
          <ChevronRight className="text-muted-foreground/50 h-3.5 w-3.5" />
          <span className="text-muted-foreground font-semibold">Attendance</span>
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-[#111827]">
          Staff Attendance
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[#6B7280]">
          Mark daily attendance for all staff members. Track presence, absences, and leave.
        </p>
      </div>

      {/* Date Navigator */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 border border-gray-200 text-gray-500 hover:text-gray-900"
            onClick={prevDay}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[200px] text-center">
            <p className="text-[15px] font-semibold text-gray-900">
              {formatDisplayDate(selectedDate)}
            </p>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setLocalStatuses({});
                setLocalNotes({});
              }}
              className="mx-auto mt-0.5 block w-auto cursor-pointer border-none bg-transparent text-center text-xs text-gray-400 outline-none"
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 border border-gray-200 text-gray-500 hover:text-gray-900"
            onClick={nextDay}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v ?? 'all')}>
            <SelectTrigger className="h-9 w-40 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Staff</SelectItem>
              <SelectItem value="teaching">Teaching</SelectItem>
              <SelectItem value="non_teaching">Non-Teaching</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="ghost"
            size="sm"
            className="h-9 border border-gray-200 text-sm text-gray-600 hover:text-gray-900"
            onClick={markAllPresent}
          >
            <CheckCircle2 className="mr-1.5 h-3.5 w-3.5 text-[#2D9B4E]" />
            Mark All Present
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
          <SummaryCard
            label="Total Staff"
            value={summary.totalStaff}
            icon={Users}
            bgColor="bg-gray-50"
            iconColor="text-gray-500"
          />
          <SummaryCard
            label="Present"
            value={summary.present}
            icon={UserCheck}
            bgColor="bg-[#E8F5ED]"
            iconColor="text-[#2D9B4E]"
          />
          <SummaryCard
            label="Absent"
            value={summary.absent}
            icon={UserX}
            bgColor="bg-[#FEF2F2]"
            iconColor="text-[#DC2626]"
          />
          <SummaryCard
            label="Late"
            value={summary.late}
            icon={Clock}
            bgColor="bg-[#FFFBEB]"
            iconColor="text-[#D97706]"
          />
          <SummaryCard
            label="On Leave"
            value={summary.onLeave}
            icon={CalendarOff}
            bgColor="bg-[#EFF6FF]"
            iconColor="text-[#2563EB]"
          />
          <SummaryCard
            label="Unmarked"
            value={summary.unmarked}
            icon={AlertTriangle}
            bgColor={summary.unmarked > 0 ? 'bg-amber-50' : 'bg-gray-50'}
            iconColor={summary.unmarked > 0 ? 'text-amber-500' : 'text-gray-400'}
          />
        </div>
      )}

      {/* Staff Attendance List */}
      <Card className="overflow-hidden border-none bg-white shadow-sm ring-1 ring-gray-100">
        <div className="divide-y divide-gray-50">
          {filteredStaff.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Users className="mb-3 h-10 w-10 text-gray-300" />
              <p className="font-semibold text-gray-900">No staff members found</p>
              <p className="mt-1 text-sm text-gray-500">
                Staff will appear here once added to your school.
              </p>
            </div>
          )}
          {filteredStaff.map((staff) => {
            const currentStatus = getStatus(staff.staffId);
            const isModified = staff.staffId in localStatuses;

            return (
              <div
                key={staff.staffId}
                className={cn(
                  'flex flex-col gap-3 px-6 py-4 transition-colors sm:flex-row sm:items-center',
                  isModified && 'bg-amber-50/30',
                )}
              >
                {/* Staff Info */}
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                    {staff.firstName[0]}
                    {staff.lastName[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {staff.firstName} {staff.lastName}
                    </p>
                    <p className="text-xs text-gray-500">{staff.jobTitle}</p>
                  </div>
                </div>

                {/* Status Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  {(Object.entries(STATUS_CONFIG) as [AttendanceStatus, typeof STATUS_CONFIG.present][]).map(
                    ([key, config]) => {
                      const isActive = currentStatus === key;
                      const Icon = config.icon;
                      return (
                        <button
                          key={key}
                          onClick={() => setStaffStatus(staff.staffId, key)}
                          className={cn(
                            'inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-xs font-medium ring-1 transition-all',
                            isActive
                              ? `${config.bgColor} ${config.color} ring-current/20`
                              : 'bg-white text-gray-400 ring-gray-200 hover:bg-gray-50 hover:text-gray-600',
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">{config.label}</span>
                        </button>
                      );
                    },
                  )}
                </div>

                {/* Notes (shown if absent/late) */}
                {currentStatus && currentStatus !== 'present' && (
                  <Input
                    placeholder="Add note..."
                    value={localNotes[staff.staffId] ?? staff.notes ?? ''}
                    onChange={(e) => setStaffNotes(staff.staffId, e.target.value)}
                    className="h-8 max-w-[200px] border-gray-200 text-xs"
                  />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Sticky Save Bar */}
      {hasChanges && (
        <div className="fixed inset-x-0 bottom-0 z-50 border-t border-gray-200 bg-white px-6 py-3 shadow-lg md:left-[240px]">
          <div className="mx-auto flex max-w-7xl items-center justify-between">
            <p className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">
                {Object.keys(localStatuses).length}
              </span>{' '}
              unsaved change{Object.keys(localStatuses).length !== 1 ? 's' : ''}
            </p>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="border border-gray-200 text-gray-600"
                onClick={() => {
                  setLocalStatuses({});
                  setLocalNotes({});
                }}
              >
                Discard
              </Button>
              <Button
                size="sm"
                className="bg-[#2D9B4E] font-semibold hover:bg-[#217A3C]"
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="mr-1.5 h-3.5 w-3.5" />
                {isSaving ? 'Saving...' : 'Save Attendance'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Summary Card ──────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  icon: Icon,
  bgColor,
  iconColor,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  bgColor: string;
  iconColor: string;
}) {
  return (
    <Card className="flex items-center gap-3 border-none bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div
        className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', bgColor)}
      >
        <Icon className={cn('h-4 w-4', iconColor)} />
      </div>
      <div>
        <p className="font-heading text-xl font-bold text-gray-900">{value}</p>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      </div>
    </Card>
  );
}
