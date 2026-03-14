'use client';

import { useState, useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../../../convex/_generated/api';
import { Id } from '../../../../../../convex/_generated/dataModel';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Clock, User, MapPin, List, LayoutGrid, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

// ── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

const SUBJECT_COLORS = [
  { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200' },
  { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200' },
  { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200' },
  { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200' },
  { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200' },
  { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200' },
  { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200' },
  { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200' },
  { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200' },
  { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200' },
];

function getSubjectColor(subjectId: string, allIds: string[]) {
  const index = allIds.indexOf(subjectId);
  return SUBJECT_COLORS[index % SUBJECT_COLORS.length];
}

function getTodayDayOfWeek(): number {
  const jsDay = new Date().getDay(); // 0=Sunday
  return jsDay === 0 ? 6 : jsDay - 1; // Convert to 0=Monday
}

function isCurrentPeriod(startTime: string, endTime: string): boolean {
  const now = new Date();
  const h = now.getHours().toString().padStart(2, '0');
  const m = now.getMinutes().toString().padStart(2, '0');
  const current = `${h}:${m}`;
  return current >= startTime && current < endTime;
}

// ── Types ────────────────────────────────────────────────────────────────────

interface PeriodDef {
  number: number;
  label: string;
  startTime: string;
  endTime: string;
  isBreak: boolean;
  isOptional: boolean;
}

interface EnrichedSlot {
  _id: string;
  subjectId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
  isPublished: boolean;
  notes?: string;
  subjectName: string;
  subjectCode: string;
  staffFirstName: string;
  staffLastName: string;
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function TimetableViewPage() {
  const periodConfig = useQuery(api.schools.periodConfig.getPeriodConfig);
  const grades = useQuery(api.academics.grades.getGradesBySchool) ?? [];
  const activeYear = useQuery(api.schools.academicYears.getCurrentAcademicYear);
  const terms = useQuery(
    api.schools.terms.getTermsByYear,
    activeYear ? { academicYearId: activeYear._id } : 'skip',
  ) ?? [];

  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedTermId, setSelectedTermId] = useState<string>('');
  const [viewLayout, setViewLayout] = useState<'grid' | 'list'>('grid');

  const activeTerm = terms.find((t) => t.isActive);
  const effectiveTermId = selectedTermId || activeTerm?._id || '';

  const allSections = useQuery(
    api.academics.sections.getSectionsByYear,
    activeYear ? { academicYearId: activeYear._id } : 'skip',
  );

  const timetableSlots = useQuery(
    api.academics.timetable.getTimetableForSection,
    selectedSectionId && effectiveTermId
      ? {
          sectionId: selectedSectionId as Id<'sections'>,
          termId: effectiveTermId as Id<'terms'>,
        }
      : 'skip',
  );

  const periods: PeriodDef[] = periodConfig?.periods ?? [];
  const isLoading = periodConfig === undefined;
  const todayDow = getTodayDayOfWeek();

  // Only show published slots
  const publishedSlots = useMemo(
    () => (timetableSlots ?? []).filter((s) => s.isPublished) as EnrichedSlot[],
    [timetableSlots],
  );

  const subjectIds = useMemo(() => {
    return [...new Set(publishedSlots.map((s) => s.subjectId))];
  }, [publishedSlots]);

  const slotLookup = useMemo(() => {
    const map = new Map<string, EnrichedSlot>();
    for (const slot of publishedSlots) {
      map.set(`${slot.dayOfWeek}-${slot.startTime}`, slot);
    }
    return map;
  }, [publishedSlots]);

  // Group sections by grade
  const sectionsByGrade = useMemo(() => {
    if (!allSections || grades.length === 0) return [];
    const gradeMap = new Map<string, { gradeName: string; gradeLevel: number; sections: typeof allSections }>();
    for (const section of allSections) {
      const gradeId = section.gradeId as string;
      if (!gradeMap.has(gradeId)) {
        const grade = grades.find((g) => g._id === gradeId);
        gradeMap.set(gradeId, {
          gradeName: grade?.name ?? 'Unknown',
          gradeLevel: grade?.level ?? 0,
          sections: [],
        });
      }
      gradeMap.get(gradeId)!.sections.push(section);
    }
    return [...gradeMap.values()].sort((a, b) => a.gradeLevel - b.gradeLevel);
  }, [allSections, grades]);

  // Today's slots for quick view
  const todaySlots = useMemo(() => {
    return publishedSlots
      .filter((s) => s.dayOfWeek === todayDow)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [publishedSlots, todayDow]);

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!periodConfig) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <PageHeader title="View Timetable" />
        <Card className="border-none bg-gray-50 shadow-none ring-1 ring-gray-100">
          <CardContent className="py-12 text-center">
            <Clock className="mx-auto mb-3 h-8 w-8 text-gray-300" />
            <p className="text-sm text-gray-400">
              No period configuration has been set up yet.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const selectedSection = allSections?.find((s) => s._id === selectedSectionId);

  return (
    <div className="mx-auto max-w-7xl space-y-5 pb-10">
      {/* Header */}
      <div>
        <div className="mb-1 flex items-center gap-2 text-sm font-medium text-[#2D9B4E]">
          <span>Academics</span>
          <ChevronRight className="text-muted-foreground/50 h-3.5 w-3.5" />
          <span className="text-muted-foreground font-semibold">View Timetable</span>
        </div>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-[#111827]">
          Class Timetable
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          View the published timetable for any section.
        </p>
      </div>

      {/* Selectors */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={effectiveTermId} onValueChange={(v) => v && setSelectedTermId(v)}>
          <SelectTrigger className="h-10 w-48 rounded-lg border-gray-200 bg-white text-sm font-medium">
            <SelectValue placeholder="Select term..." />
          </SelectTrigger>
          <SelectContent>
            {terms.map((t) => (
              <SelectItem key={t._id} value={t._id}>
                {t.name} {t.isActive && '(Active)'}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={selectedSectionId} onValueChange={(v) => v && setSelectedSectionId(v)}>
          <SelectTrigger className="h-10 w-64 rounded-lg border-gray-200 bg-white text-sm font-medium">
            <SelectValue placeholder="Select section..." />
          </SelectTrigger>
          <SelectContent>
            {sectionsByGrade.map((group) => (
              <div key={group.gradeName}>
                <div className="px-2 py-1.5 text-xs font-bold tracking-wider text-gray-400 uppercase">
                  {group.gradeName}
                </div>
                {group.sections.map((s) => (
                  <SelectItem key={s._id} value={s._id}>
                    {s.displayName}
                  </SelectItem>
                ))}
              </div>
            ))}
          </SelectContent>
        </Select>

        {selectedSectionId && publishedSlots.length > 0 && (
          <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-0.5">
            <button
              onClick={() => setViewLayout('grid')}
              className={cn(
                'rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                viewLayout === 'grid'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-400 hover:text-gray-600',
              )}
            >
              <LayoutGrid className="mr-1 inline h-3.5 w-3.5" />
              Grid
            </button>
            <button
              onClick={() => setViewLayout('list')}
              className={cn(
                'rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors',
                viewLayout === 'list'
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-400 hover:text-gray-600',
              )}
            >
              <List className="mr-1 inline h-3.5 w-3.5" />
              List
            </button>
          </div>
        )}
      </div>

      {/* No section selected */}
      {!selectedSectionId && (
        <Card className="border-none bg-gray-50 shadow-none ring-1 ring-gray-100">
          <CardContent className="py-12 text-center">
            <p className="text-sm text-gray-400">
              Select a section above to view its timetable.
            </p>
          </CardContent>
        </Card>
      )}

      {/* No published timetable */}
      {selectedSectionId && publishedSlots.length === 0 && timetableSlots !== undefined && (
        <Card className="border-none bg-gray-50 shadow-none ring-1 ring-gray-100">
          <CardContent className="py-12 text-center">
            <Clock className="mx-auto mb-3 h-8 w-8 text-gray-300" />
            <p className="text-sm font-medium text-gray-500">No published timetable</p>
            <p className="mt-1 text-xs text-gray-400">
              The timetable for {selectedSection?.displayName ?? 'this section'} has not been
              published yet.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Timetable content */}
      {selectedSectionId && publishedSlots.length > 0 && (
        <>
          {/* Today's Timetable quick view */}
          {todaySlots.length > 0 && (
            <Card className="border-none bg-gradient-to-r from-[#2D9B4E]/5 to-transparent shadow-sm ring-1 ring-[#2D9B4E]/10">
              <CardContent className="py-4">
                <h3 className="mb-3 text-xs font-bold tracking-wider text-[#2D9B4E] uppercase">
                  Today &mdash; {DAY_NAMES[todayDow]}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {todaySlots.map((slot) => {
                    const color = getSubjectColor(slot.subjectId, subjectIds);
                    const isCurrent = isCurrentPeriod(slot.startTime, slot.endTime);
                    return (
                      <div
                        key={slot._id}
                        className={cn(
                          'rounded-lg border px-3 py-2',
                          color.bg,
                          color.border,
                          isCurrent && 'ring-2 ring-[#2D9B4E] ring-offset-1',
                        )}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-medium text-gray-500">
                            {slot.startTime}–{slot.endTime}
                          </span>
                          {isCurrent && (
                            <Badge className="h-4 bg-[#2D9B4E] px-1.5 text-[9px] text-white">
                              NOW
                            </Badge>
                          )}
                        </div>
                        <div className={cn('text-xs font-semibold', color.text)}>
                          {slot.subjectName}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          {slot.staffFirstName} {slot.staffLastName}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Grid View */}
          {viewLayout === 'grid' && (
            <div className="overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="w-20 border-b border-r border-gray-100 bg-gray-50 p-2 text-left text-xs font-semibold text-gray-500">
                      Time
                    </th>
                    {DAY_NAMES.map((day, i) => (
                      <th
                        key={i}
                        className={cn(
                          'border-b border-r border-gray-100 p-2 text-center text-xs font-semibold last:border-r-0',
                          i === todayDow
                            ? 'bg-[#2D9B4E]/5 text-[#2D9B4E]'
                            : 'bg-gray-50 text-gray-700',
                        )}
                      >
                        <span className="hidden sm:inline">{day}</span>
                        <span className="sm:hidden">{DAY_SHORT[i]}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {periods.map((period) => (
                    <tr key={period.number} className={period.isBreak ? 'bg-amber-50/40' : ''}>
                      <td className="border-b border-r border-gray-100 p-2">
                        <div className="text-xs font-medium text-gray-700">{period.label}</div>
                        <div className="text-[10px] text-gray-400">
                          {period.startTime}–{period.endTime}
                        </div>
                      </td>
                      {[0, 1, 2, 3, 4].map((dayOfWeek) => {
                        const slot = slotLookup.get(`${dayOfWeek}-${period.startTime}`);
                        const color = slot ? getSubjectColor(slot.subjectId, subjectIds) : null;
                        const isCurrent =
                          dayOfWeek === todayDow &&
                          isCurrentPeriod(period.startTime, period.endTime);

                        return (
                          <td
                            key={dayOfWeek}
                            className={cn(
                              'border-b border-r border-gray-100 p-1 last:border-r-0',
                              dayOfWeek === todayDow && 'bg-[#2D9B4E]/[0.02]',
                              isCurrent && !period.isBreak && 'bg-[#2D9B4E]/5',
                            )}
                          >
                            {period.isBreak ? (
                              <div className="flex h-10 items-center justify-center">
                                <span className="text-[10px] font-medium text-amber-500">
                                  {period.label}
                                </span>
                              </div>
                            ) : slot ? (
                              <div
                                className={cn(
                                  'rounded-lg border p-2',
                                  color?.bg,
                                  color?.border,
                                  isCurrent && 'ring-2 ring-[#2D9B4E] ring-offset-1',
                                )}
                              >
                                <div className={cn('truncate text-xs font-semibold', color?.text)}>
                                  {slot.subjectName}
                                </div>
                                <div className="mt-0.5 truncate text-[10px] text-gray-500">
                                  {slot.staffFirstName} {slot.staffLastName}
                                </div>
                                {slot.room && (
                                  <div className="mt-0.5 flex items-center gap-0.5 text-[10px] text-gray-400">
                                    <MapPin className="h-2.5 w-2.5" />
                                    {slot.room}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="flex h-10 items-center justify-center">
                                <span className="text-[10px] text-gray-200">—</span>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* List View (mobile-friendly) */}
          {viewLayout === 'list' && (
            <div className="space-y-6">
              {DAY_NAMES.map((dayName, dayOfWeek) => {
                const daySlots = publishedSlots
                  .filter((s) => s.dayOfWeek === dayOfWeek)
                  .sort((a, b) => a.startTime.localeCompare(b.startTime));

                if (daySlots.length === 0) return null;

                return (
                  <div key={dayOfWeek}>
                    <h3
                      className={cn(
                        'mb-2 text-sm font-bold',
                        dayOfWeek === todayDow ? 'text-[#2D9B4E]' : 'text-gray-700',
                      )}
                    >
                      {dayName}
                      {dayOfWeek === todayDow && (
                        <Badge className="ml-2 h-4 bg-[#2D9B4E] px-1.5 text-[9px] text-white">
                          TODAY
                        </Badge>
                      )}
                    </h3>
                    <div className="space-y-1.5">
                      {daySlots.map((slot) => {
                        const color = getSubjectColor(slot.subjectId, subjectIds);
                        const isCurrent =
                          dayOfWeek === todayDow &&
                          isCurrentPeriod(slot.startTime, slot.endTime);

                        return (
                          <div
                            key={slot._id}
                            className={cn(
                              'flex items-center gap-3 rounded-xl border p-3',
                              color.bg,
                              color.border,
                              isCurrent && 'ring-2 ring-[#2D9B4E] ring-offset-1',
                            )}
                          >
                            <div className="w-20 shrink-0 text-center">
                              <div className="text-xs font-bold text-gray-700">
                                {slot.startTime}
                              </div>
                              <div className="text-[10px] text-gray-400">{slot.endTime}</div>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className={cn('truncate text-sm font-semibold', color.text)}>
                                {slot.subjectName}
                              </div>
                              <div className="mt-0.5 flex items-center gap-3 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {slot.staffFirstName} {slot.staffLastName}
                                </span>
                                {slot.room && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {slot.room}
                                  </span>
                                )}
                              </div>
                            </div>
                            {isCurrent && (
                              <Badge className="bg-[#2D9B4E] text-[10px] text-white">NOW</Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
