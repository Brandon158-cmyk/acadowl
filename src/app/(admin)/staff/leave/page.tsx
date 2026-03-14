'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  ChevronRight,
  CalendarDays,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  User,
  CalendarOff,
} from 'lucide-react';
import { Id } from '../../../../../convex/_generated/dataModel';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';

// ── ISSUE-061 · Leave Management Page ──

const LEAVE_TYPES: Record<string, { label: string; color: string }> = {
  annual: { label: 'Annual Leave', color: 'bg-blue-50 text-blue-700' },
  sick: { label: 'Sick Leave', color: 'bg-red-50 text-red-700' },
  maternity_paternity: { label: 'Maternity / Paternity', color: 'bg-purple-50 text-purple-700' },
  compassionate: { label: 'Compassionate', color: 'bg-amber-50 text-amber-700' },
  unpaid: { label: 'Unpaid Leave', color: 'bg-gray-100 text-gray-700' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bgColor: string; icon: typeof Clock }> = {
  pending: {
    label: 'Pending',
    color: 'text-[#D97706]',
    bgColor: 'bg-[#FFFBEB]',
    icon: Clock,
  },
  approved: {
    label: 'Approved',
    color: 'text-[#2D9B4E]',
    bgColor: 'bg-[#E8F5ED]',
    icon: CheckCircle2,
  },
  rejected: {
    label: 'Rejected',
    color: 'text-[#DC2626]',
    bgColor: 'bg-[#FEF2F2]',
    icon: XCircle,
  },
};

function formatDateShort(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

type FilterStatus = 'all' | 'pending' | 'approved' | 'rejected';

export default function LeaveManagementPage() {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [isRespondModalOpen, setIsRespondModalOpen] = useState(false);
  const [respondTarget, setRespondTarget] = useState<{
    id: Id<'leaveRequests'>;
    staffName: string;
    leaveType: string;
    startDate: string;
    endDate: string;
    daysRequested: number;
    reason: string;
  } | null>(null);
  const [responseAction, setResponseAction] = useState<'approved' | 'rejected'>('approved');
  const [responseNote, setResponseNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const leaveRequests =
    useQuery(api.staff.leaveRequests.getAllLeaveRequests, {
      status: filterStatus === 'all' ? undefined : filterStatus,
    }) ?? [];

  const allLeaveRequests =
    useQuery(api.staff.leaveRequests.getAllLeaveRequests, {}) ?? [];

  const pendingRequests =
    useQuery(api.staff.leaveRequests.getPendingLeaveRequests) ?? [];

  const respondMutation = useMutation(api.staff.leaveRequests.respondToLeaveRequest);

  const handleRespond = async () => {
    if (!respondTarget) return;
    setIsSubmitting(true);
    try {
      await respondMutation({
        requestId: respondTarget.id,
        action: responseAction,
        responseNote: responseNote || undefined,
      });
      toast.success(
        `Leave request ${responseAction === 'approved' ? 'approved' : 'rejected'} for ${respondTarget.staffName}.`,
      );
      setIsRespondModalOpen(false);
      setRespondTarget(null);
      setResponseNote('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to process leave request.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-10">
      {/* Header */}
      <div className="space-y-1">
        <div className="mb-1 flex items-center gap-2 text-sm font-medium text-[#2D9B4E]">
          <span>Staff</span>
          <ChevronRight className="text-muted-foreground/50 h-3.5 w-3.5" />
          <span className="text-muted-foreground font-semibold">Leave Management</span>
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-[#111827]">
          Leave Management
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-[#6B7280]">
          Review and manage staff leave requests. Approved leave is automatically reflected in
          attendance records.
        </p>
      </div>

      {/* Pending Banner */}
      {pendingRequests.length > 0 && (
        <Card className="flex items-start gap-4 border-none bg-amber-50 p-5 ring-1 ring-amber-200">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-900">
              {pendingRequests.length} pending leave request{pendingRequests.length !== 1 ? 's' : ''}
            </p>
            <p className="mt-0.5 text-sm text-amber-700">
              Review and respond to leave requests below.
            </p>
          </div>
        </Card>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          label="Pending"
          value={pendingRequests.length}
          icon={Clock}
          bgColor="bg-[#FFFBEB]"
          iconColor="text-[#D97706]"
        />
        <SummaryCard
          label="Approved"
          value={allLeaveRequests.filter((r) => r.status === 'approved').length}
          icon={CheckCircle2}
          bgColor="bg-[#E8F5ED]"
          iconColor="text-[#2D9B4E]"
        />
        <SummaryCard
          label="Rejected"
          value={allLeaveRequests.filter((r) => r.status === 'rejected').length}
          icon={XCircle}
          bgColor="bg-[#FEF2F2]"
          iconColor="text-[#DC2626]"
        />
        <SummaryCard
          label="Total"
          value={allLeaveRequests.length}
          icon={FileText}
          bgColor="bg-gray-50"
          iconColor="text-gray-500"
        />
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as FilterStatus[]).map((status) => (
          <Button
            key={status}
            variant={filterStatus === status ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setFilterStatus(status)}
            className={cn(
              'h-9 text-sm capitalize',
              filterStatus === status
                ? 'bg-[#2D9B4E] text-white hover:bg-[#217A3C]'
                : 'text-gray-500 hover:text-gray-900',
            )}
          >
            {status}
            {status === 'pending' && pendingRequests.length > 0 && (
              <span className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-white">
                {pendingRequests.length}
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Leave Requests List */}
      <div className="space-y-3">
        {leaveRequests.length === 0 && (
          <Card className="flex flex-col items-center justify-center border-none bg-gray-50 p-12 text-center ring-1 ring-gray-100">
            <CalendarOff className="mb-3 h-10 w-10 text-gray-300" />
            <p className="font-semibold text-gray-900">No leave requests</p>
            <p className="mt-1 text-sm text-gray-500">
              {filterStatus === 'all'
                ? 'Leave requests from staff will appear here.'
                : `No ${filterStatus} leave requests.`}
            </p>
          </Card>
        )}

        {leaveRequests.map((request) => {
          const leaveConfig = LEAVE_TYPES[request.leaveType] ?? {
            label: request.leaveType,
            color: 'bg-gray-100 text-gray-700',
          };
          const statusConfig = STATUS_CONFIG[request.status];
          const StatusIcon = statusConfig.icon;

          return (
            <Card
              key={request._id}
              className={cn(
                'overflow-hidden border-none bg-white shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md',
                request.status === 'pending' && 'ring-amber-200',
              )}
            >
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start">
                {/* Staff Avatar */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-600">
                  {request.staffFirstName[0]}
                  {request.staffLastName[0]}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <h3 className="text-[15px] font-semibold text-gray-900">
                        {request.staffFirstName} {request.staffLastName}
                      </h3>
                      <p className="text-xs text-gray-500">{request.staffJobTitle}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                          leaveConfig.color,
                        )}
                      >
                        {leaveConfig.label}
                      </span>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
                          statusConfig.bgColor,
                          statusConfig.color,
                        )}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusConfig.label}
                      </span>
                    </div>
                  </div>

                  {/* Date Range */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
                      {formatDateShort(request.startDate)} — {formatDateShort(request.endDate)}
                    </span>
                    <span className="inline-flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-gray-400" />
                      {request.daysRequested} day{request.daysRequested !== 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Reason */}
                  <p className="text-sm text-gray-600">
                    <span className="font-medium text-gray-700">Reason:</span> {request.reason}
                  </p>

                  {/* Response Note (if responded) */}
                  {request.responseNote && (
                    <p className="text-sm text-gray-500 italic">
                      <span className="font-medium not-italic">Response:</span>{' '}
                      {request.responseNote}
                      {request.approverName && (
                        <span className="ml-1 text-xs text-gray-400">— {request.approverName}</span>
                      )}
                    </p>
                  )}

                  {/* Actions (only for pending) */}
                  {request.status === 'pending' && (
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        className="h-8 bg-[#2D9B4E] text-xs font-semibold hover:bg-[#217A3C]"
                        onClick={() => {
                          setRespondTarget({
                            id: request._id,
                            staffName: `${request.staffFirstName} ${request.staffLastName}`,
                            leaveType: leaveConfig.label,
                            startDate: request.startDate,
                            endDate: request.endDate,
                            daysRequested: request.daysRequested,
                            reason: request.reason,
                          });
                          setResponseAction('approved');
                          setResponseNote('');
                          setIsRespondModalOpen(true);
                        }}
                      >
                        <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 border border-red-200 text-xs font-semibold text-red-600 hover:bg-red-50"
                        onClick={() => {
                          setRespondTarget({
                            id: request._id,
                            staffName: `${request.staffFirstName} ${request.staffLastName}`,
                            leaveType: leaveConfig.label,
                            startDate: request.startDate,
                            endDate: request.endDate,
                            daysRequested: request.daysRequested,
                            reason: request.reason,
                          });
                          setResponseAction('rejected');
                          setResponseNote('');
                          setIsRespondModalOpen(true);
                        }}
                      >
                        <XCircle className="mr-1 h-3.5 w-3.5" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Respond Modal */}
      <Dialog open={isRespondModalOpen} onOpenChange={setIsRespondModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="font-heading text-lg font-bold text-gray-900">
            {responseAction === 'approved' ? 'Approve' : 'Reject'} Leave Request
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            {responseAction === 'approved'
              ? 'Approving will auto-mark attendance as "on leave" for the leave period.'
              : 'Provide a reason for rejecting this leave request.'}
          </DialogDescription>

          {respondTarget && (
            <div className="space-y-4 py-2">
              {/* Request Summary */}
              <Card className="border-none bg-gray-50 p-4 ring-1 ring-gray-100">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <span className="font-semibold text-gray-900">{respondTarget.staffName}</span>
                  </div>
                  <p className="text-gray-600">
                    {respondTarget.leaveType} · {respondTarget.daysRequested} day
                    {respondTarget.daysRequested !== 1 ? 's' : ''}
                  </p>
                  <p className="text-gray-600">
                    {formatDateShort(respondTarget.startDate)} —{' '}
                    {formatDateShort(respondTarget.endDate)}
                  </p>
                  <p className="text-gray-500">{respondTarget.reason}</p>
                </div>
              </Card>

              {/* Response Note */}
              <div className="space-y-1.5">
                <label className="text-[13px] font-medium text-gray-700">
                  Note {responseAction === 'rejected' ? '(required)' : '(optional)'}
                </label>
                <Textarea
                  value={responseNote}
                  onChange={(e) => setResponseNote(e.target.value)}
                  placeholder={
                    responseAction === 'approved'
                      ? 'Any notes for the staff member...'
                      : 'Reason for rejecting this request...'
                  }
                  className="min-h-[80px] resize-none border-gray-200"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsRespondModalOpen(false)}
              className="border border-gray-200 text-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRespond}
              disabled={isSubmitting || (responseAction === 'rejected' && !responseNote.trim())}
              className={cn(
                'font-semibold',
                responseAction === 'approved'
                  ? 'bg-[#2D9B4E] hover:bg-[#217A3C]'
                  : 'bg-[#DC2626] hover:bg-[#B91C1C]',
              )}
            >
              {isSubmitting
                ? 'Processing...'
                : responseAction === 'approved'
                  ? 'Approve Leave'
                  : 'Reject Leave'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
  icon: typeof Clock;
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
