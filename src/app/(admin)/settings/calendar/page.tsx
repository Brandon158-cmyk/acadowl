'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import type { Id } from '../../../../../convex/_generated/dataModel';
import { useSchool } from '@/hooks/useSchool';
import { PageHeader } from '@/components/shared/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Loader2,
  Plus,
  ChevronLeft,
  ChevronRight,
  Trash2,
  Download,
  AlertTriangle,
} from 'lucide-react';

// ────────────────────────────────────────
// Event type config
// ────────────────────────────────────────

const EVENT_TYPES = {
  holiday: {
    label: 'Holiday',
    color: 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]/60',
    dot: 'bg-[#DC2626]',
  },
  exam_period: {
    label: 'Exam Period',
    color: 'bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]/60',
    dot: 'bg-[#D97706]',
  },
  sports_day: {
    label: 'Sports Day',
    color: 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE]/60',
    dot: 'bg-[#2563EB]',
  },
  school_closure: {
    label: 'Closure',
    color: 'bg-[#FFF7ED] text-[#EA580C] border border-[#FED7AA]/60',
    dot: 'bg-[#EA580C]',
  },
  parent_teacher: {
    label: 'PTM',
    color: 'bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]/60',
    dot: 'bg-[#7C3AED]',
  },
  general: {
    label: 'General',
    color: 'bg-[#F9FAFB] text-[#374151] border border-[#E5E7EB]',
    dot: 'bg-[#6B7280]',
  },
} as const;

type EventType = keyof typeof EVENT_TYPES;
interface SchoolEvent {
  _id: Id<'schoolEvents'>;
  title: string;
  startDate: string;
  endDate: string;
  type: string;
  affectsAttendance: boolean;
  visibleToParents: boolean;
  description?: string;
}

// ────────────────────────────────────────
// Calendar Page
// ────────────────────────────────────────

export default function SchoolCalendarPage() {
  const { school, isLoading: isSchoolLoading } = useSchool();
  const currentYear = useQuery(api.schools.academicYears.getCurrentAcademicYear);

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });

  const events = useQuery(
    api.schools.schoolEvents.getEventsByYear,
    currentYear ? { academicYearId: currentYear._id } : 'skip',
  );

  const seedHolidays = useMutation(api.schools.schoolEvents.seedZambiaHolidays);
  const deleteEvent = useMutation(api.schools.schoolEvents.deleteSchoolEvent);
  const [seedLoading, setSeedLoading] = useState(false);

  if (isSchoolLoading || !school) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!currentYear) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="School Calendar"
          description="Manage holidays, closures, and school events."
        />
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <p>
            No active academic year. Activate an academic year in Settings → Academic Year first.
          </p>
        </div>
      </div>
    );
  }

  const handleSeedHolidays = async () => {
    setSeedLoading(true);
    try {
      const result = await seedHolidays({ academicYearId: currentYear._id });
      toast.success(`Imported ${result.imported} Zambia public holiday(s).`);
    } catch {
      toast.error('Failed to import holidays.');
    } finally {
      setSeedLoading(false);
    }
  };

  const handleDeleteEvent = async (eventId: Id<'schoolEvents'>) => {
    try {
      await deleteEvent({ eventId });
      toast.success('Event deleted.');
    } catch {
      toast.error('Failed to delete event.');
    }
  };

  const prevMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 };
      return { year: prev.year, month: prev.month - 1 };
    });
  };

  const nextMonth = () => {
    setCurrentMonth((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 };
      return { year: prev.year, month: prev.month + 1 };
    });
  };

  const monthName = new Date(currentMonth.year, currentMonth.month).toLocaleDateString('en-ZM', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-8 pb-12">
      <PageHeader title="School Calendar" description={`Events for ${currentYear.label}`}>
        <Button variant="outline" onClick={handleSeedHolidays} disabled={seedLoading}>
          {seedLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Import Zambia Holidays
        </Button>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger render={<Button />}>
            <Plus className="mr-2 h-4 w-4" />
            Add Event
          </DialogTrigger>
          <CreateEventDialog
            academicYearId={currentYear._id}
            onClose={() => setCreateDialogOpen(false)}
          />
        </Dialog>
      </PageHeader>

      {/* Legend */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(EVENT_TYPES).map(([key, config]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={`h-2.5 w-2.5 rounded-full ${config.dot}`} />
            <span className="text-[13px] font-medium text-[#6B7280]">{config.label}</span>
          </div>
        ))}
      </div>

      <Card className="border border-[#E5E7EB] shadow-sm">
        <CardContent className="space-y-6 p-0 sm:p-6 lg:p-8">
          {/* Month navigation */}
          <div className="flex items-center justify-between">
            <h3 className="font-heading text-lg font-semibold text-[#111827]">{monthName}</h3>
            <div className="flex rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] p-1">
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={prevMonth}
                className="h-7 w-7 text-[#6B7280] hover:text-[#111827]"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={nextMonth}
                className="h-7 w-7 text-[#6B7280] hover:text-[#111827]"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Calendar grid */}
          <CalendarGrid year={currentMonth.year} month={currentMonth.month} events={events || []} />
        </CardContent>
      </Card>

      {/* Events list for the month */}
      <Card className="border border-[#E5E7EB] shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="font-heading text-[18px] text-[#111827]">
            Events This Month
          </CardTitle>
          <CardDescription className="text-[14px]">
            Upcoming and past items for {monthName}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EventsList
            events={events || []}
            year={currentMonth.year}
            month={currentMonth.month}
            onDelete={handleDeleteEvent}
          />
        </CardContent>
      </Card>
    </div>
  );
}

// ────────────────────────────────────────
// Calendar Grid
// ────────────────────────────────────────

function CalendarGrid({
  year,
  month,
  events,
}: {
  year: number;
  month: number;
  events: SchoolEvent[];
}) {
  const days = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPad = firstDay.getDay(); // 0 = Sunday

    const cells: Array<{ date: number | null; dateStr: string; isToday: boolean }> = [];
    const today = new Date().toISOString().split('T')[0];

    // Empty cells before first day
    for (let i = 0; i < startPad; i++) {
      cells.push({ date: null, dateStr: '', isToday: false });
    }

    // Day cells
    for (let d = 1; d <= lastDay.getDate(); d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ date: d, dateStr, isToday: dateStr === today });
    }

    return cells;
  }, [year, month]);

  const getEventsForDate = (dateStr: string) =>
    events.filter((e) => e.startDate <= dateStr && e.endDate >= dateStr);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
      {/* Header */}
      <div className="grid grid-cols-7 border-b border-[#E5E7EB] bg-[#F9FAFB]">
        {weekDays.map((d) => (
          <div
            key={d}
            className="py-3 text-center text-[12px] font-semibold tracking-wide text-[#6B7280] uppercase"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7">
        {days.map((cell, i) => {
          if (cell.date === null) {
            return (
              <div
                key={i}
                className="min-h-[100px] border-r border-b border-[#E5E7EB] bg-[#F9FAFB]/50 last:border-r-0 xl:min-h-[120px]"
              />
            );
          }

          const dayEvents = getEventsForDate(cell.dateStr);
          const isWeekend = i % 7 === 0 || i % 7 === 6;

          return (
            <div
              key={i}
              className={`flex min-h-[100px] flex-col gap-1.5 border-r border-b border-[#E5E7EB] p-2 transition-colors last:border-r-0 hover:bg-[#F9FAFB] xl:min-h-[120px] ${
                isWeekend ? 'bg-[#F9FAFB]/80' : 'bg-white'
              } ${cell.isToday ? 'bg-[#E8F5EB]/30 ring-2 ring-[#2D8C3E]/20 ring-inset' : ''}`}
            >
              <p
                className={`mr-1 self-end text-[13px] font-medium ${
                  cell.isToday
                    ? 'font-bold text-[#2D8C3E]'
                    : isWeekend
                      ? 'text-[#9CA3AF]'
                      : 'text-[#374151]'
                }`}
              >
                {cell.date}
              </p>
              <div className="custom-scrollbar flex-1 space-y-1.5">
                {dayEvents.map((evt) => {
                  const config = EVENT_TYPES[evt.type as EventType] || EVENT_TYPES.general;
                  return (
                    <div
                      key={evt._id}
                      className={`truncate rounded-md px-2 py-1 text-[11px] leading-tight font-medium ${config.color}`}
                      title={evt.title}
                    >
                      {evt.title}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ────────────────────────────────────────
// Events List
// ────────────────────────────────────────

function EventsList({
  events,
  year,
  month,
  onDelete,
}: {
  events: SchoolEvent[];
  year: number;
  month: number;
  onDelete: (id: Id<'schoolEvents'>) => void;
}) {
  const firstDay = `${year}-${String(month + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(year, month + 1, 0).toISOString().split('T')[0];

  const monthEvents = events.filter((e) => e.startDate <= lastDay && e.endDate >= firstDay);

  if (monthEvents.length === 0) {
    return <p className="py-6 text-center text-[14px] text-[#6B7280]">No events this month.</p>;
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short' });

  return (
    <div className="space-y-3">
      {monthEvents.map((event) => {
        const config = EVENT_TYPES[event.type as EventType] || EVENT_TYPES.general;
        return (
          <div
            key={event._id}
            className="flex items-center justify-between rounded-lg border border-[#E5E7EB] bg-white px-4 py-3 shadow-sm transition-all hover:border-[#D1D5DB]"
          >
            <div className="flex items-center gap-4">
              <div className={`h-3 w-3 shrink-0 rounded-full ${config.dot}`} />
              <div>
                <p className="text-[14px] font-semibold text-[#111827]">{event.title}</p>
                <p className="text-[13px] text-[#6B7280]">
                  {formatDate(event.startDate)}
                  {event.startDate !== event.endDate && ` — ${formatDate(event.endDate)}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={`border-none px-2 py-0.5 text-xs font-medium ${config.color}`}
              >
                {config.label}
              </Badge>
              {event.affectsAttendance && (
                <Badge
                  variant="outline"
                  className="border-none bg-[#F3F4F6] px-2 py-0.5 text-xs font-medium text-[#4B5563]"
                >
                  No Attendance
                </Badge>
              )}
              <Button
                size="icon-sm"
                variant="ghost"
                onClick={() => onDelete(event._id)}
                className="text-[#9CA3AF] hover:bg-[#FEF2F2] hover:text-[#DC2626]"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────
// Create Event Dialog
// ────────────────────────────────────────

function CreateEventDialog({
  academicYearId,
  onClose,
}: {
  academicYearId: Id<'academicYears'>;
  onClose: () => void;
}) {
  const createEvent = useMutation(api.schools.schoolEvents.createSchoolEvent);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    type: 'general' as EventType,
    affectsAttendance: false,
    visibleToParents: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createEvent({
        academicYearId,
        title: form.title,
        description: form.description || undefined,
        startDate: form.startDate,
        endDate: form.endDate || form.startDate,
        type: form.type,
        affectsAttendance: form.affectsAttendance,
        visibleToParents: form.visibleToParents,
      });
      toast.success('Event created.');
      onClose();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to create event.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent className="gap-6 p-6 sm:max-w-md">
      <form onSubmit={handleSubmit}>
        <DialogHeader className="space-y-3">
          <DialogTitle className="font-heading text-xl text-[#111827]">
            Add School Event
          </DialogTitle>
          <DialogDescription className="text-[14px] text-[#6B7280]">
            Add a holiday, closure, exam period, or custom event to the calendar.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-6">
          <div className="space-y-2.5">
            <Label htmlFor="title" className="text-[14px] font-medium text-[#374151]">
              Title
            </Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Independence Day"
              required
            />
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="type" className="text-[14px] font-medium text-[#374151]">
              Type
            </Label>
            <select
              id="type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as EventType })}
              className="flex h-10 w-full rounded-md border-[1.5px] border-[#E5E7EB] bg-white px-3 py-2 text-[14px] text-[#111827] transition-all outline-none focus:border-[#2D8C3E] focus:shadow-[0_0_0_3px_rgba(45,140,62,0.15)] focus:ring-0"
            >
              {Object.entries(EVENT_TYPES).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2.5">
              <Label htmlFor="eventStartDate" className="text-[14px] font-medium text-[#374151]">
                Start Date
              </Label>
              <Input
                id="eventStartDate"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="eventEndDate" className="text-[14px] font-medium text-[#374151]">
                End Date
              </Label>
              <Input
                id="eventEndDate"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2.5">
            <Label htmlFor="description" className="text-[14px] font-medium text-[#374151]">
              Description (optional)
            </Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description"
            />
          </div>

          <div className="flex flex-col gap-4 pt-2">
            <label className="group flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={form.affectsAttendance}
                onChange={(e) => setForm({ ...form, affectsAttendance: e.target.checked })}
                className="h-[18px] w-[18px] cursor-pointer rounded-[4px] border-[1.5px] border-[#D1D5DB] text-[#2D8C3E] transition-all group-hover:border-[#2D8C3E] focus:ring-[#2D8C3E]/20"
              />
              <span className="text-[14px] text-[#374151] select-none">
                Affects attendance (no attendance required on this day)
              </span>
            </label>
            <label className="group flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={form.visibleToParents}
                onChange={(e) => setForm({ ...form, visibleToParents: e.target.checked })}
                className="h-[18px] w-[18px] cursor-pointer rounded-[4px] border-[1.5px] border-[#D1D5DB] text-[#2D8C3E] transition-all group-hover:border-[#2D8C3E] focus:ring-[#2D8C3E]/20"
              />
              <span className="text-[14px] text-[#374151] select-none">
                Visible to parents on the portal
              </span>
            </label>
          </div>
        </div>
        <DialogFooter className="border-t border-[#E5E7EB] pt-6 pb-2">
          <Button type="button" variant="outline" size="modal" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="modal" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Event
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
