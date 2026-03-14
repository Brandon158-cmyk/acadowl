'use client';

import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Id } from '../../../../../convex/_generated/dataModel';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  Loader2,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Copy,
  Printer,
  Trash2,
  Clock,
  User,
  BookOpen,
  MapPin,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// ── Constants ────────────────────────────────────────────────────────────────

const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];

// ── Color palette for subjects ───────────────────────────────────────────────

const SUBJECT_COLORS = [
  { bg: 'bg-blue-100', text: 'text-blue-800', border: 'border-blue-200', ring: 'ring-blue-300' },
  { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', ring: 'ring-emerald-300' },
  { bg: 'bg-purple-100', text: 'text-purple-800', border: 'border-purple-200', ring: 'ring-purple-300' },
  { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', ring: 'ring-amber-300' },
  { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200', ring: 'ring-rose-300' },
  { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200', ring: 'ring-cyan-300' },
  { bg: 'bg-orange-100', text: 'text-orange-800', border: 'border-orange-200', ring: 'ring-orange-300' },
  { bg: 'bg-indigo-100', text: 'text-indigo-800', border: 'border-indigo-200', ring: 'ring-indigo-300' },
  { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200', ring: 'ring-teal-300' },
  { bg: 'bg-pink-100', text: 'text-pink-800', border: 'border-pink-200', ring: 'ring-pink-300' },
];

function getSubjectColor(subjectId: string, allIds: string[]) {
  const index = allIds.indexOf(subjectId);
  return SUBJECT_COLORS[index % SUBJECT_COLORS.length];
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
  _id: Id<'timetableSlots'>;
  sectionId: Id<'sections'>;
  subjectId: Id<'subjects'>;
  staffId: Id<'staff'>;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string;
  termId: Id<'terms'>;
  isPublished: boolean;
  notes?: string;
  subjectName: string;
  subjectCode: string;
  staffFirstName: string;
  staffLastName: string;
}

interface Assignment {
  _id: Id<'staffSubjectAssignments'>;
  staffId: Id<'staff'>;
  subjectId: Id<'subjects'>;
  staffFirstName: string;
  staffLastName: string;
  subjectName: string;
  subjectCode: string;
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function TimetableBuilderPage() {
  const periodConfig = useQuery(api.schools.periodConfig.getPeriodConfig);
  const grades = useQuery(api.academics.grades.getGradesBySchool) ?? [];
  const activeYear = useQuery(api.schools.academicYears.getCurrentAcademicYear);
  const terms = useQuery(
    api.schools.terms.getTermsByYear,
    activeYear ? { academicYearId: activeYear._id } : 'skip',
  ) ?? [];

  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedTermId, setSelectedTermId] = useState<string>('');
  const [viewMode, setViewMode] = useState<'section' | 'teacher'>('section');
  const [showPublishDialog, setShowPublishDialog] = useState(false);
  const [showCopyDialog, setShowCopyDialog] = useState(false);
  const [copyTargetTermId, setCopyTargetTermId] = useState<string>('');

  // Auto-select active term
  const activeTerm = terms.find((t) => t.isActive);
  const effectiveTermId = selectedTermId || activeTerm?._id || '';

  // Get sections for all grades
  const allSections = useQuery(
    api.academics.sections.getSectionsByYear,
    activeYear ? { academicYearId: activeYear._id } : 'skip',
  );

  // Get timetable slots for selected section
  const timetableSlots = useQuery(
    api.academics.timetable.getTimetableForSection,
    selectedSectionId && effectiveTermId
      ? {
          sectionId: selectedSectionId as Id<'sections'>,
          termId: effectiveTermId as Id<'terms'>,
        }
      : 'skip',
  );

  // Get assignments for the selected section (palette)
  const sectionAssignments = useQuery(
    api.staff.assignments.getAssignmentsForSection,
    selectedSectionId ? { sectionId: selectedSectionId as Id<'sections'> } : 'skip',
  );

  // Get conflicts
  const conflicts = useQuery(
    api.academics.timetable.getConflicts,
    selectedSectionId && effectiveTermId
      ? {
          sectionId: selectedSectionId as Id<'sections'>,
          termId: effectiveTermId as Id<'terms'>,
        }
      : 'skip',
  );

  // Mutations
  const createSlot = useMutation(api.academics.timetable.createTimetableSlot);
  const deleteSlot = useMutation(api.academics.timetable.deleteTimetableSlot);
  const publishTimetable = useMutation(api.academics.timetable.publishTimetable);
  const unpublishTimetable = useMutation(api.academics.timetable.unpublishTimetable);
  const copyTimetable = useMutation(api.academics.timetable.copyTimetableToNextTerm);

  const periods: PeriodDef[] = periodConfig?.periods ?? [];
  const isLoading = periodConfig === undefined;

  // Build a lookup: subjectId list for consistent coloring
  const subjectIds = useMemo(() => {
    const ids = (sectionAssignments ?? []).map((a) => a.subjectId as string);
    return [...new Set(ids)];
  }, [sectionAssignments]);

  // Build a slot lookup: `day-startTime` → slot
  const slotLookup = useMemo(() => {
    const map = new Map<string, EnrichedSlot>();
    for (const slot of timetableSlots ?? []) {
      const key = `${slot.dayOfWeek}-${slot.startTime}`;
      map.set(key, slot as EnrichedSlot);
    }
    return map;
  }, [timetableSlots]);

  // Check if published
  const isPublished = useMemo(() => {
    if (!timetableSlots || timetableSlots.length === 0) return false;
    return timetableSlots.every((s) => s.isPublished);
  }, [timetableSlots]);

  // Conflict slot IDs
  const conflictSlotIds = useMemo(() => {
    const ids = new Set<string>();
    for (const c of conflicts ?? []) {
      ids.add(c.conflictSlotId);
    }
    return ids;
  }, [conflicts]);

  // ── Palette state (selected subject-teacher for placement) ──
  const [selectedPaletteItem, setSelectedPaletteItem] = useState<{
    subjectId: string;
    staffId: string;
    subjectName: string;
    staffName: string;
  } | null>(null);

  const handleCellClick = async (dayOfWeek: number, period: PeriodDef) => {
    if (period.isBreak) return;
    if (!effectiveTermId || !selectedSectionId) return;

    const key = `${dayOfWeek}-${period.startTime}`;
    const existingSlot = slotLookup.get(key);

    if (existingSlot) {
      // Delete existing slot
      try {
        await deleteSlot({ slotId: existingSlot._id });
        toast.success('Slot removed.');
      } catch (e) {
        toast.error((e as Error).message || 'Failed to remove slot.');
      }
      return;
    }

    if (!selectedPaletteItem) {
      toast.info('Select a subject-teacher pair from the palette first.');
      return;
    }

    try {
      await createSlot({
        sectionId: selectedSectionId as Id<'sections'>,
        subjectId: selectedPaletteItem.subjectId as Id<'subjects'>,
        staffId: selectedPaletteItem.staffId as Id<'staff'>,
        dayOfWeek,
        startTime: period.startTime,
        endTime: period.endTime,
        termId: effectiveTermId as Id<'terms'>,
      });
      toast.success(`${selectedPaletteItem.subjectName} placed.`);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to place slot.');
    }
  };

  const handlePublish = async () => {
    try {
      if (isPublished) {
        await unpublishTimetable({
          sectionId: selectedSectionId as Id<'sections'>,
          termId: effectiveTermId as Id<'terms'>,
        });
        toast.success('Timetable unpublished.');
      } else {
        await publishTimetable({
          sectionId: selectedSectionId as Id<'sections'>,
          termId: effectiveTermId as Id<'terms'>,
        });
        toast.success('Timetable published! Students and parents can now see it.');
      }
      setShowPublishDialog(false);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to update publish status.');
    }
  };

  const handleCopy = async () => {
    if (!copyTargetTermId || !effectiveTermId) return;
    try {
      const result = await copyTimetable({
        fromTermId: effectiveTermId as Id<'terms'>,
        toTermId: copyTargetTermId as Id<'terms'>,
      });
      toast.success(`Copied ${result.copied} slots. ${result.skipped} skipped (already have slots).`);
      setShowCopyDialog(false);
    } catch (e) {
      toast.error((e as Error).message || 'Failed to copy timetable.');
    }
  };

  // Group sections by grade for the selector
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

  // ── Render ──

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
        <PageHeader title="Timetable Builder" />
        <Card className="border-none bg-white shadow-sm ring-1 ring-gray-100">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100">
              <Clock className="h-8 w-8 text-amber-600" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-gray-900">
                Period configuration required
              </h3>
              <p className="max-w-md text-sm text-gray-500">
                Before building timetables, you need to define your school&apos;s daily period
                structure (period times, breaks, etc.).
              </p>
            </div>
            <Link href="/settings/periods">
              <Button className="h-11 bg-[#2D9B4E] px-6 font-semibold hover:bg-[#217A3C]">
                <Clock className="mr-2 h-4 w-4" />
                Configure Periods
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-5 pb-10">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm font-medium text-[#2D9B4E]">
              <span>Academics</span>
              <ChevronRight className="text-muted-foreground/50 h-3.5 w-3.5" />
              <span className="text-muted-foreground font-semibold">Timetable</span>
            </div>
            <h1 className="font-heading text-2xl font-semibold tracking-tight text-[#111827]">
              Timetable Builder
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedSectionId && effectiveTermId && timetableSlots && timetableSlots.length > 0 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCopyDialog(true)}
                >
                  <Copy className="mr-1.5 h-3.5 w-3.5" />
                  Copy to Term
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.print()}
                >
                  <Printer className="mr-1.5 h-3.5 w-3.5" />
                  Print
                </Button>
                <Button
                  size="sm"
                  onClick={() => setShowPublishDialog(true)}
                  className={
                    isPublished
                      ? 'bg-gray-700 hover:bg-gray-800'
                      : 'bg-[#2D9B4E] hover:bg-[#217A3C]'
                  }
                >
                  {isPublished ? (
                    <>
                      <EyeOff className="mr-1.5 h-3.5 w-3.5" />
                      Unpublish
                    </>
                  ) : (
                    <>
                      <Eye className="mr-1.5 h-3.5 w-3.5" />
                      Publish
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Selectors */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Term selector */}
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

          {/* Section selector grouped by grade */}
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

          {/* Status badges */}
          {selectedSectionId && timetableSlots && (
            <div className="flex items-center gap-2">
              <Badge
                variant="outline"
                className={cn(
                  'text-xs',
                  isPublished
                    ? 'border-green-200 bg-green-50 text-green-700'
                    : 'border-gray-200 bg-gray-50 text-gray-500',
                )}
              >
                {isPublished ? (
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                ) : (
                  <EyeOff className="mr-1 h-3 w-3" />
                )}
                {isPublished ? 'Published' : 'Draft'}
              </Badge>
              {(conflicts?.length ?? 0) > 0 && (
                <Badge variant="outline" className="border-red-200 bg-red-50 text-xs text-red-600">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  {conflicts!.length} conflict{conflicts!.length !== 1 ? 's' : ''}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {timetableSlots.length} slot{timetableSlots.length !== 1 ? 's' : ''}
              </Badge>
            </div>
          )}
        </div>

        {/* No section selected */}
        {!selectedSectionId && (
          <Card className="border-none bg-gray-50 shadow-none ring-1 ring-gray-100">
            <CardContent className="py-12 text-center">
              <p className="text-sm text-gray-400">Select a section above to view or edit its timetable.</p>
            </CardContent>
          </Card>
        )}

        {/* Timetable Grid + Palette */}
        {selectedSectionId && effectiveTermId && (
          <div className="flex gap-5">
            {/* Left palette */}
            <div className="hidden w-56 shrink-0 lg:block">
              <SubjectPalette
                assignments={(sectionAssignments ?? []) as Assignment[]}
                subjectIds={subjectIds}
                selectedItem={selectedPaletteItem}
                onSelect={setSelectedPaletteItem}
              />
            </div>

            {/* Grid */}
            <div className="min-w-0 flex-1 overflow-x-auto">
              <div className="print:shadow-none print:ring-0 rounded-xl bg-white shadow-sm ring-1 ring-gray-100">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="w-20 border-b border-r border-gray-100 bg-gray-50 p-2 text-left text-xs font-semibold text-gray-500">
                        Time
                      </th>
                      {DAY_NAMES.map((day, i) => (
                        <th
                          key={i}
                          className="border-b border-r border-gray-100 bg-gray-50 p-2 text-center text-xs font-semibold text-gray-700 last:border-r-0"
                        >
                          <span className="hidden sm:inline">{day}</span>
                          <span className="sm:hidden">{DAY_SHORT[i]}</span>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {periods.map((period) => (
                      <tr
                        key={period.number}
                        className={period.isBreak ? 'bg-amber-50/40' : ''}
                      >
                        {/* Time column */}
                        <td className="border-b border-r border-gray-100 p-2">
                          <div className="text-xs font-medium text-gray-700">{period.label}</div>
                          <div className="text-[10px] text-gray-400">
                            {period.startTime}–{period.endTime}
                          </div>
                        </td>

                        {/* Day cells */}
                        {[0, 1, 2, 3, 4].map((dayOfWeek) => {
                          const key = `${dayOfWeek}-${period.startTime}`;
                          const slot = slotLookup.get(key);
                          const hasConflict = slot && conflictSlotIds.has(slot._id as string);
                          const color = slot
                            ? getSubjectColor(slot.subjectId as string, subjectIds)
                            : null;

                          return (
                            <td
                              key={dayOfWeek}
                              className={cn(
                                'border-b border-r border-gray-100 p-1 last:border-r-0',
                                period.isBreak
                                  ? 'cursor-not-allowed'
                                  : 'cursor-pointer transition-colors hover:bg-gray-50',
                              )}
                              onClick={() => handleCellClick(dayOfWeek, period)}
                            >
                              {period.isBreak ? (
                                <div className="flex h-12 items-center justify-center">
                                  <span className="text-[10px] font-medium text-amber-500">
                                    {period.label}
                                  </span>
                                </div>
                              ) : slot ? (
                                <Tooltip>
                                  <TooltipTrigger>
                                    <div
                                      className={cn(
                                        'relative rounded-lg border p-2',
                                        color?.bg,
                                        color?.border,
                                        hasConflict &&
                                          'ring-2 ring-red-400 ring-offset-1',
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
                                      {hasConflict && (
                                        <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-red-500" />
                                      )}
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs">
                                    <div className="space-y-1 text-xs">
                                      <div className="font-semibold">{slot.subjectName}</div>
                                      <div className="flex items-center gap-1 text-gray-400">
                                        <User className="h-3 w-3" />
                                        {slot.staffFirstName} {slot.staffLastName}
                                      </div>
                                      {slot.room && (
                                        <div className="flex items-center gap-1 text-gray-400">
                                          <MapPin className="h-3 w-3" />
                                          {slot.room}
                                        </div>
                                      )}
                                      {slot.notes && (
                                        <div className="text-gray-400">{slot.notes}</div>
                                      )}
                                      {hasConflict && (
                                        <div className="font-medium text-red-500">
                                          ⚠ Conflict detected — click to remove
                                        </div>
                                      )}
                                      <div className="pt-1 text-gray-300">Click to remove</div>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              ) : (
                                <div className="flex h-12 items-center justify-center">
                                  {selectedPaletteItem ? (
                                    <div className="text-[10px] text-gray-300">+ Place here</div>
                                  ) : (
                                    <div className="text-[10px] text-gray-200">—</div>
                                  )}
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

              {/* Mobile palette (shown below grid on small screens) */}
              <div className="mt-4 lg:hidden">
                <SubjectPalette
                  assignments={(sectionAssignments ?? []) as Assignment[]}
                  subjectIds={subjectIds}
                  selectedItem={selectedPaletteItem}
                  onSelect={setSelectedPaletteItem}
                />
              </div>
            </div>
          </div>
        )}

        {/* Publish Dialog */}
        <Dialog open={showPublishDialog} onOpenChange={setShowPublishDialog}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogTitle>
              {isPublished ? 'Unpublish Timetable?' : 'Publish Timetable?'}
            </DialogTitle>
            <DialogDescription>
              {isPublished
                ? 'This will hide the timetable from students and parents. Only admins will be able to see it.'
                : 'Published timetables are visible to students and parents. Make sure all conflicts are resolved before publishing.'}
            </DialogDescription>
            {!isPublished && (conflicts?.length ?? 0) > 0 && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>
                  There are {conflicts!.length} unresolved conflict
                  {conflicts!.length !== 1 ? 's' : ''}. Publishing with conflicts is allowed but not
                  recommended.
                </span>
              </div>
            )}
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowPublishDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handlePublish}
                className={
                  isPublished
                    ? 'bg-gray-700 hover:bg-gray-800'
                    : 'bg-[#2D9B4E] hover:bg-[#217A3C]'
                }
              >
                {isPublished ? 'Unpublish' : 'Publish'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Copy to Term Dialog */}
        <Dialog open={showCopyDialog} onOpenChange={setShowCopyDialog}>
          <DialogContent className="sm:max-w-[420px]">
            <DialogTitle>Copy Timetable to Another Term</DialogTitle>
            <DialogDescription>
              Copy all timetable slots from the current term to another. Sections that already have
              slots in the target term will be skipped.
            </DialogDescription>
            <Select value={copyTargetTermId} onValueChange={(v) => v && setCopyTargetTermId(v)}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Select target term..." />
              </SelectTrigger>
              <SelectContent>
                {terms
                  .filter((t) => t._id !== effectiveTermId)
                  .map((t) => (
                    <SelectItem key={t._id} value={t._id}>
                      {t.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setShowCopyDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCopy}
                disabled={!copyTargetTermId}
                className="bg-[#2D9B4E] hover:bg-[#217A3C]"
              >
                <Copy className="mr-1.5 h-3.5 w-3.5" />
                Copy
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}

// ── Subject Palette ──────────────────────────────────────────────────────────

function SubjectPalette({
  assignments,
  subjectIds,
  selectedItem,
  onSelect,
}: {
  assignments: Assignment[];
  subjectIds: string[];
  selectedItem: { subjectId: string; staffId: string } | null;
  onSelect: (item: { subjectId: string; staffId: string; subjectName: string; staffName: string } | null) => void;
}) {
  if (assignments.length === 0) {
    return (
      <Card className="border-none bg-gray-50 shadow-none ring-1 ring-gray-100">
        <CardContent className="py-8 text-center">
          <BookOpen className="mx-auto mb-2 h-6 w-6 text-gray-300" />
          <p className="text-xs text-gray-400">
            No subject-teacher assignments found for this section.
          </p>
          <Link
            href="/staff/assignments"
            className="mt-2 inline-block text-xs font-medium text-[#2D9B4E] underline underline-offset-2"
          >
            Assign teachers →
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold tracking-wider text-gray-400 uppercase">
          Subject Palette
        </h3>
        {selectedItem && (
          <button
            onClick={() => onSelect(null)}
            className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-gray-600"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>
      <div className="space-y-1">
        {assignments.map((a) => {
          const color = getSubjectColor(a.subjectId as string, subjectIds);
          const isSelected =
            selectedItem?.subjectId === (a.subjectId as string) &&
            selectedItem?.staffId === (a.staffId as string);

          return (
            <button
              key={a._id}
              onClick={() =>
                isSelected
                  ? onSelect(null)
                  : onSelect({
                      subjectId: a.subjectId as string,
                      staffId: a.staffId as string,
                      subjectName: a.subjectName,
                      staffName: `${a.staffFirstName} ${a.staffLastName}`,
                    })
              }
              className={cn(
                'w-full rounded-lg border p-2.5 text-left transition-all',
                color.bg,
                color.border,
                isSelected && `ring-2 ${color.ring} ring-offset-1 shadow-sm`,
                !isSelected && 'hover:shadow-sm',
              )}
            >
              <div className={cn('truncate text-xs font-semibold', color.text)}>
                {a.subjectName}
              </div>
              <div className="mt-0.5 truncate text-[10px] text-gray-500">
                {a.staffFirstName} {a.staffLastName}
              </div>
            </button>
          );
        })}
      </div>
      <p className="pt-1 text-[10px] text-gray-300">
        Click a subject, then click a grid cell to place it.
      </p>
    </div>
  );
}
