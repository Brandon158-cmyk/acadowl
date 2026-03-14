'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
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
  PlusCircle,
  ChevronRight,
  BookOpen,
  Users,
  Trash2,
  AlertTriangle,
  UserCheck,
  Search,
  LayoutGrid,
  GraduationCap,
} from 'lucide-react';
import { Id } from '../../../../../convex/_generated/dataModel';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

// ── ISSUE-059 · Staff Subject & Section Assignment Page ──

type ViewMode = 'by-teacher' | 'by-section';

export default function StaffAssignmentsPage() {
  const activeYear = useQuery(api.schools.academicYears.getCurrentAcademicYear);
  const teachingStaff = useQuery(api.staff.assignments.getTeachingStaff) ?? [];
  const grades = useQuery(api.academics.grades.getGradesBySchool) ?? [];

  const assignMutation = useMutation(api.staff.assignments.assignStaffToSubjectSection);
  const removeMutation = useMutation(api.staff.assignments.removeStaffAssignment);

  const [viewMode, setViewMode] = useState<ViewMode>('by-teacher');
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [selectedGradeId, setSelectedGradeId] = useState<string>('');
  const [selectedSectionId, setSelectedSectionId] = useState<string>('');
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [isPrimary, setIsPrimary] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter staff by search
  const filteredStaff = teachingStaff.filter(
    (s) =>
      searchQuery === '' ||
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleAddAssignment = async () => {
    if (!selectedStaffId || !selectedSectionId || !selectedSubjectId || !activeYear) return;
    setIsSubmitting(true);
    try {
      await assignMutation({
        staffId: selectedStaffId as Id<'staff'>,
        subjectId: selectedSubjectId as Id<'subjects'>,
        sectionId: selectedSectionId as Id<'sections'>,
        academicYearId: activeYear._id,
        isPrimaryTeacher: isPrimary,
      });
      toast.success('Assignment created successfully.');
      setIsAddModalOpen(false);
      resetForm();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create assignment.';
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId: Id<'staffSubjectAssignments'>) => {
    try {
      await removeMutation({ assignmentId });
      toast.success('Assignment removed.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to remove assignment.';
      toast.error(message);
    }
  };

  const resetForm = () => {
    setSelectedStaffId('');
    setSelectedGradeId('');
    setSelectedSectionId('');
    setSelectedSubjectId('');
    setIsPrimary(true);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-10">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex flex-col flex-wrap items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm font-medium text-[#2D9B4E]">
              <span>Staff</span>
              <ChevronRight className="text-muted-foreground/50 h-3.5 w-3.5" />
              <span className="text-muted-foreground font-semibold">Subject Assignments</span>
            </div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-[#111827]">
              Staff Subject Assignments
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-[#6B7280]">
              Assign teachers to subjects and sections. This drives timetable building, mark entry,
              and LMS course creation.
            </p>
          </div>
          <Button
            onClick={() => {
              resetForm();
              setIsAddModalOpen(true);
            }}
            disabled={!activeYear}
            className="h-11 bg-[#2D9B4E] px-6 font-semibold hover:bg-[#217A3C]"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Assignment
          </Button>
        </div>
      </div>

      {/* No Academic Year Banner */}
      {activeYear === null && (
        <Card className="flex items-start gap-4 border-none bg-amber-50 p-5 ring-1 ring-amber-200">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-900">No active academic year</p>
            <p className="mt-0.5 text-sm text-amber-700">
              Activate an academic year before creating assignments.{' '}
              <Link
                href="/settings/academic-year"
                className="underline underline-offset-2 hover:text-amber-900"
              >
                Set up academic year →
              </Link>
            </p>
          </div>
        </Card>
      )}

      {activeYear && (
        <>
          {/* Controls Row */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-xs flex-1">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search teacher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-10 rounded-full border-transparent bg-gray-100 pl-10 text-sm focus:border-[#2D9B4E] focus:bg-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant={viewMode === 'by-teacher' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('by-teacher')}
                className={cn(
                  'h-9 gap-1.5 text-sm',
                  viewMode === 'by-teacher'
                    ? 'bg-[#2D9B4E] text-white hover:bg-[#217A3C]'
                    : 'text-gray-500 hover:text-gray-900',
                )}
              >
                <Users className="h-3.5 w-3.5" />
                By Teacher
              </Button>
              <Button
                variant={viewMode === 'by-section' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('by-section')}
                className={cn(
                  'h-9 gap-1.5 text-sm',
                  viewMode === 'by-section'
                    ? 'bg-[#2D9B4E] text-white hover:bg-[#217A3C]'
                    : 'text-gray-500 hover:text-gray-900',
                )}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                By Section
              </Button>
            </div>
          </div>

          {/* Content */}
          {viewMode === 'by-teacher' && (
            <div className="space-y-6">
              {filteredStaff.length === 0 && (
                <Card className="flex flex-col items-center justify-center border-none bg-gray-50 p-12 text-center ring-1 ring-gray-100">
                  <Users className="mb-3 h-10 w-10 text-gray-300" />
                  <p className="font-semibold text-gray-900">No teaching staff found</p>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchQuery
                      ? 'Try a different search term.'
                      : 'Add teaching staff to your school first.'}
                  </p>
                </Card>
              )}
              {filteredStaff.map((staff) => (
                <TeacherAssignmentCard
                  key={staff._id}
                  staff={staff}
                  academicYearId={activeYear._id}
                  onRemove={handleRemoveAssignment}
                />
              ))}
            </div>
          )}

          {viewMode === 'by-section' && (
            <div className="space-y-10">
              {grades.map((grade) => (
                <GradeSectionAssignments
                  key={grade._id}
                  grade={grade}
                  academicYearId={activeYear._id}
                  onRemove={handleRemoveAssignment}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* Add Assignment Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle className="font-heading text-lg font-bold text-gray-900">
            Add Subject Assignment
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500">
            Assign a teacher to a subject in a specific section.
          </DialogDescription>
          <div className="space-y-4 py-2">
            {/* Teacher */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-gray-700">
                Teacher <span className="text-red-600">*</span>
              </label>
              <Select value={selectedStaffId} onValueChange={(v) => setSelectedStaffId(v ?? '')}>
                <SelectTrigger className="h-12 border-gray-200">
                  <SelectValue placeholder="Select a teacher" />
                </SelectTrigger>
                <SelectContent>
                  {teachingStaff.map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.firstName} {s.lastName} — {s.jobTitle}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Grade */}
            <div className="space-y-1.5">
              <label className="text-[13px] font-medium text-gray-700">
                Grade <span className="text-red-600">*</span>
              </label>
              <Select
                value={selectedGradeId}
                onValueChange={(v) => {
                  setSelectedGradeId(v ?? '');
                  setSelectedSectionId('');
                  setSelectedSubjectId('');
                }}
              >
                <SelectTrigger className="h-12 border-gray-200">
                  <SelectValue placeholder="Select a grade" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((g) => (
                    <SelectItem key={g._id} value={g._id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Section (filtered by grade) */}
            {selectedGradeId && activeYear && (
              <GradeSectionSelect
                gradeId={selectedGradeId as Id<'grades'>}
                academicYearId={activeYear._id}
                value={selectedSectionId}
                onChange={setSelectedSectionId}
              />
            )}

            {/* Subject (filtered by grade) */}
            {selectedGradeId && (
              <GradeSubjectSelect
                gradeId={selectedGradeId as Id<'grades'>}
                value={selectedSubjectId}
                onChange={setSelectedSubjectId}
              />
            )}

            {/* Primary Teacher toggle */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isPrimary"
                checked={isPrimary}
                onChange={(e) => setIsPrimary(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-[#2D9B4E] focus:ring-[#2D9B4E]"
              />
              <label htmlFor="isPrimary" className="text-sm text-gray-700">
                Primary teacher for this subject
              </label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setIsAddModalOpen(false)}
              className="border border-gray-200 text-gray-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddAssignment}
              disabled={
                !selectedStaffId || !selectedSectionId || !selectedSubjectId || isSubmitting
              }
              className="bg-[#2D9B4E] font-semibold hover:bg-[#217A3C]"
            >
              {isSubmitting ? 'Assigning...' : 'Create Assignment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Section Select (filtered by grade) ────────────────────────

function GradeSectionSelect({
  gradeId,
  academicYearId,
  value,
  onChange,
}: {
  gradeId: Id<'grades'>;
  academicYearId: Id<'academicYears'>;
  value: string;
  onChange: (v: string) => void;
}) {
  const sections =
    useQuery(api.academics.sections.getSectionsByGrade, { gradeId, academicYearId }) ?? [];

  return (
    <div className="space-y-1.5">
      <label className="text-[13px] font-medium text-gray-700">
        Section <span className="text-red-600">*</span>
      </label>
      <Select value={value} onValueChange={(v) => onChange(v ?? '')}>
        <SelectTrigger className="h-12 border-gray-200">
          <SelectValue placeholder="Select a section" />
        </SelectTrigger>
        <SelectContent>
          {sections.map((s) => (
            <SelectItem key={s._id} value={s._id}>
              {s.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ── Subject Select (filtered by grade) ────────────────────────

function GradeSubjectSelect({
  gradeId,
  value,
  onChange,
}: {
  gradeId: Id<'grades'>;
  value: string;
  onChange: (v: string) => void;
}) {
  const subjects = useQuery(api.academics.subjects.getSubjectsByGrade, { gradeId }) ?? [];

  return (
    <div className="space-y-1.5">
      <label className="text-[13px] font-medium text-gray-700">
        Subject <span className="text-red-600">*</span>
      </label>
      <Select value={value} onValueChange={(v) => onChange(v ?? '')}>
        <SelectTrigger className="h-12 border-gray-200">
          <SelectValue placeholder="Select a subject" />
        </SelectTrigger>
        <SelectContent>
          {subjects.map((s) => (
            <SelectItem key={s._id} value={s._id}>
              {s.name} {s.code ? `(${s.code})` : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ── Teacher Assignment Card ───────────────────────────────────

function TeacherAssignmentCard({
  staff,
  academicYearId,
  onRemove,
}: {
  staff: {
    _id: Id<'staff'>;
    firstName: string;
    lastName: string;
    photoUrl?: string;
    jobTitle: string;
    assignmentCount: number;
  };
  academicYearId: Id<'academicYears'>;
  onRemove: (id: Id<'staffSubjectAssignments'>) => void;
}) {
  const assignments =
    useQuery(api.staff.assignments.getAssignmentsForStaff, {
      staffId: staff._id,
      academicYearId,
    }) ?? [];

  return (
    <Card className="overflow-hidden border-none bg-white shadow-sm ring-1 ring-gray-100">
      {/* Teacher Header */}
      <div className="flex items-center gap-4 border-b border-gray-100 px-6 py-4">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#2D9B4E]/10 text-sm font-bold text-[#2D9B4E]">
          {staff.firstName[0]}
          {staff.lastName[0]}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-heading text-[15px] font-semibold text-gray-900">
            {staff.firstName} {staff.lastName}
          </h3>
          <p className="text-xs text-gray-500">{staff.jobTitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold',
              assignments.length > 0
                ? 'bg-[#E8F5ED] text-[#2D9B4E]'
                : 'bg-gray-100 text-gray-400',
            )}
          >
            <BookOpen className="h-3 w-3" />
            {assignments.length} subject{assignments.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Assignments Table */}
      {assignments.length > 0 ? (
        <div className="divide-y divide-gray-50">
          {assignments.map((a) => (
            <div
              key={a._id}
              className="flex items-center gap-4 px-6 py-3 transition-colors hover:bg-gray-50/50"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-600">
                {a.subjectCode || a.subjectName.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">{a.subjectName}</p>
                <p className="text-xs text-gray-500">
                  {a.sectionDisplayName} · {a.gradeName}
                </p>
              </div>
              {a.isPrimaryTeacher && (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700">
                  <UserCheck className="h-3 w-3" />
                  Primary
                </span>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-gray-300 hover:bg-red-50 hover:text-red-600"
                onClick={() => onRemove(a._id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="px-6 py-8 text-center">
          <p className="text-sm text-gray-400">No subjects assigned yet</p>
        </div>
      )}
    </Card>
  );
}

// ── Grade → Section Assignments (by-section view) ──────────────

function GradeSectionAssignments({
  grade,
  academicYearId,
  onRemove,
}: {
  grade: { _id: Id<'grades'>; name: string; level: number };
  academicYearId: Id<'academicYears'>;
  onRemove: (id: Id<'staffSubjectAssignments'>) => void;
}) {
  const sections =
    useQuery(api.academics.sections.getSectionsByGrade, {
      gradeId: grade._id,
      academicYearId,
    }) ?? [];

  if (sections.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-4 w-4 text-[#2D9B4E]" />
        <h2 className="font-heading text-lg font-bold text-gray-900">{grade.name}</h2>
        <span className="text-xs text-gray-400">
          {sections.length} section{sections.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <SectionAssignmentCard
            key={section._id}
            sectionId={section._id}
            sectionName={section.displayName}
            onRemove={onRemove}
          />
        ))}
      </div>
    </div>
  );
}

// ── Section Assignment Card ───────────────────────────────────

function SectionAssignmentCard({
  sectionId,
  sectionName,
  onRemove,
}: {
  sectionId: Id<'sections'>;
  sectionName: string;
  onRemove: (id: Id<'staffSubjectAssignments'>) => void;
}) {
  const assignments =
    useQuery(api.staff.assignments.getAssignmentsForSection, { sectionId }) ?? [];

  return (
    <Card className="flex flex-col border-none bg-white shadow-sm ring-1 ring-gray-100">
      <div className="border-b border-gray-100 px-5 py-3">
        <h4 className="text-sm font-semibold text-gray-900">{sectionName}</h4>
        <p className="text-xs text-gray-400">
          {assignments.length} teacher{assignments.length !== 1 ? 's' : ''} assigned
        </p>
      </div>
      {assignments.length > 0 ? (
        <div className="divide-y divide-gray-50 py-1">
          {assignments.map((a) => (
            <div key={a._id} className="flex items-center gap-3 px-5 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900">{a.subjectName}</p>
                <p className="text-xs text-gray-500">
                  {a.staffFirstName} {a.staffLastName}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-gray-300 hover:bg-red-50 hover:text-red-600"
                onClick={() => onRemove(a._id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 px-5 py-6 text-center">
          <p className="text-xs text-gray-400">No assignments</p>
        </div>
      )}
    </Card>
  );
}
