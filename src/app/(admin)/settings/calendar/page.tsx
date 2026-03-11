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
    color: 'bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300',
    dot: 'bg-red-500',
  },
  exam_period: {
    label: 'Exam Period',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  sports_day: {
    label: 'Sports Day',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  school_closure: {
    label: 'Closure',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-300',
    dot: 'bg-orange-500',
  },
  parent_teacher: {
    label: 'PTM',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-300',
    dot: 'bg-purple-500',
  },
  general: {
    label: 'General',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-950/40 dark:text-gray-300',
    dot: 'bg-gray-500',
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
    <div className="space-y-6">
      <PageHeader title="School Calendar" description={`Events for ${currentYear.label}`}>
        <Button size="sm" variant="outline" onClick={handleSeedHolidays} disabled={seedLoading}>
          {seedLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          Import Zambia Holidays
        </Button>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger render={<Button size="sm" />}>
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
      <div className="flex flex-wrap gap-3">
        {Object.entries(EVENT_TYPES).map(([key, config]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className={`h-2.5 w-2.5 rounded-full ${config.dot}`} />
            <span className="text-muted-foreground text-xs">{config.label}</span>
          </div>
        ))}
      </div>

      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button size="sm" variant="ghost" onClick={prevMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-sm font-medium">{monthName}</h3>
        <Button size="sm" variant="ghost" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Calendar grid */}
      <CalendarGrid year={currentMonth.year} month={currentMonth.month} events={events || []} />

      {/* Events list for the month */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Events This Month</CardTitle>
          <CardDescription>{monthName}</CardDescription>
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
    <div className="overflow-hidden rounded-lg border">
      {/* Header */}
      <div className="bg-muted/50 grid grid-cols-7 border-b">
        {weekDays.map((d) => (
          <div key={d} className="text-muted-foreground px-2 py-2 text-center text-xs font-medium">
            {d}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7">
        {days.map((cell, i) => {
          if (cell.date === null) {
            return <div key={i} className="h-20 border-r border-b last:border-r-0" />;
          }

          const dayEvents = getEventsForDate(cell.dateStr);
          const isWeekend = i % 7 === 0 || i % 7 === 6;

          return (
            <div
              key={i}
              className={`h-20 border-r border-b p-1 last:border-r-0 ${
                isWeekend ? 'bg-muted/30' : ''
              } ${cell.isToday ? 'bg-primary/5 ring-primary/30 ring-1 ring-inset' : ''}`}
            >
              <p
                className={`text-xs ${
                  cell.isToday ? 'text-primary font-bold' : isWeekend ? 'text-muted-foreground' : ''
                }`}
              >
                {cell.date}
              </p>
              <div className="mt-0.5 space-y-0.5">
                {dayEvents.slice(0, 2).map((evt) => {
                  const config = EVENT_TYPES[evt.type as EventType] || EVENT_TYPES.general;
                  return (
                    <div
                      key={evt._id}
                      className={`truncate rounded px-1 py-0.5 text-[10px] leading-tight ${config.color}`}
                      title={evt.title}
                    >
                      {evt.title}
                    </div>
                  );
                })}
                {dayEvents.length > 2 && (
                  <p className="text-muted-foreground pl-1 text-[10px]">
                    +{dayEvents.length - 2} more
                  </p>
                )}
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
    return <p className="text-muted-foreground text-sm">No events this month.</p>;
  }

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short' });

  return (
    <div className="space-y-2">
      {monthEvents.map((event) => {
        const config = EVENT_TYPES[event.type as EventType] || EVENT_TYPES.general;
        return (
          <div
            key={event._id}
            className="flex items-center justify-between rounded-md border px-3 py-2"
          >
            <div className="flex items-center gap-3">
              <div className={`h-2.5 w-2.5 rounded-full ${config.dot}`} />
              <div>
                <p className="text-sm font-medium">{event.title}</p>
                <p className="text-muted-foreground text-xs">
                  {formatDate(event.startDate)}
                  {event.startDate !== event.endDate && ` — ${formatDate(event.endDate)}`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className={`text-xs ${config.color}`}>
                {config.label}
              </Badge>
              {event.affectsAttendance && (
                <Badge variant="outline" className="text-xs">
                  No Attendance
                </Badge>
              )}
              <Button size="icon-sm" variant="ghost" onClick={() => onDelete(event._id)}>
                <Trash2 className="h-3 w-3" />
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
    <DialogContent className="sm:max-w-md">
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Add School Event</DialogTitle>
          <DialogDescription>
            Add a holiday, closure, exam period, or custom event to the calendar.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Independence Day"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <select
              id="type"
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as EventType })}
              className="border-input bg-background ring-offset-background flex h-9 w-full rounded-md border px-3 py-1 text-sm"
            >
              {Object.entries(EVENT_TYPES).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="eventStartDate">Start Date</Label>
              <Input
                id="eventStartDate"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="eventEndDate">End Date</Label>
              <Input
                id="eventEndDate"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Input
              id="description"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Brief description"
            />
          </div>

          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.affectsAttendance}
                onChange={(e) => setForm({ ...form, affectsAttendance: e.target.checked })}
                className="h-4 w-4 rounded border"
              />
              Affects attendance (no attendance required on this day)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={form.visibleToParents}
                onChange={(e) => setForm({ ...form, visibleToParents: e.target.checked })}
                className="h-4 w-4 rounded border"
              />
              Visible to parents on the portal
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Event
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
