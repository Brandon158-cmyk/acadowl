'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  PlusCircle,
  ChevronRight,
  LayoutGrid,
  UserCheck,
  DoorOpen,
  Edit2,
  UserPlus,
  AlertTriangle,
  BookOpen,
} from 'lucide-react';
import { Id } from '../../../../../convex/_generated/dataModel';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Link from 'next/link';

// ─── Capacity status helper ────────────────────────────────────────────────

function getCapacityColor(fillPercent: number | null): {
  bar: string;
  text: string;
  bg: string;
} {
  if (fillPercent === null) return { bar: 'bg-gray-200', text: 'text-gray-400', bg: 'bg-gray-50' };
  if (fillPercent >= 95) return { bar: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50' };
  if (fillPercent >= 80) return { bar: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' };
  return { bar: 'bg-[#2D9B4E]', text: 'text-[#2D9B4E]', bg: 'bg-green-50' };
}

// ─── Section Card ──────────────────────────────────────────────────────────

interface SectionCardProps {
  section: {
    _id: Id<'sections'>;
    name: string;
    displayName: string;
    capacity?: number;
    room?: string;
    classTeacher: { firstName: string; lastName: string } | null;
    enrolledCount?: number;
  };
  onEdit: () => void;
  onAssignTeacher: () => void;
}

function SectionCard({ section, onEdit, onAssignTeacher }: SectionCardProps) {
  const enrolled = section.enrolledCount ?? 0;
  const fillPercent =
    section.capacity != null ? Math.round((enrolled / section.capacity) * 100) : null;
  const colors = getCapacityColor(fillPercent);

  return (
    <Card className="group relative flex flex-col gap-4 overflow-hidden border-none bg-white p-5 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md hover:ring-gray-200">
      {/* Header Row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2D9B4E]/10 text-[#2D9B4E] transition-colors group-hover:bg-[#2D9B4E]/20">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h4 className="font-heading text-[17px] leading-tight font-semibold text-gray-900">
              {section.displayName}
            </h4>
            {section.room && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                <DoorOpen className="h-3 w-3" />
                {section.room}
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-900"
            onClick={onEdit}
          >
            <Edit2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-lg text-gray-400 hover:bg-blue-50 hover:text-blue-600"
            onClick={onAssignTeacher}
          >
            <UserPlus className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Class Teacher */}
      <div className="flex items-center gap-2">
        {section.classTeacher ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
            <UserCheck className="h-3 w-3" />
            {section.classTeacher.firstName} {section.classTeacher.lastName}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-400">
            <UserPlus className="h-3 w-3" />
            Unassigned
          </span>
        )}
      </div>

      {/* Capacity Bar */}
      <div className="space-y-2">
        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className={cn('h-full rounded-full transition-all duration-500', colors.bar)}
            style={{ width: `${Math.min(fillPercent ?? 0, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-gray-400">
            {enrolled}
            {section.capacity != null ? ` / ${section.capacity}` : ''} students
          </span>
          {fillPercent !== null && (
            <span className={cn('text-xs font-bold', colors.text)}>{fillPercent}% full</span>
          )}
        </div>
      </div>
    </Card>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────

export default function SectionsPage() {
  const grades = useQuery(api.academics.grades.getGradesBySchool) ?? [];
  const activeYear = useQuery(api.schools.academicYears.getCurrentAcademicYear);

  const createSection = useMutation(api.academics.sections.createSection);
  const updateSection = useMutation(api.academics.sections.updateSection);
  const assignClassTeacher = useMutation(api.academics.sections.assignClassTeacher);

  // ── Modal state ──
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);

  // ── Add section form ──
  const [addForm, setAddForm] = useState({
    gradeId: '' as string,
    name: '',
    room: '',
    capacity: '',
  });

  // ── Edit section ──
  const [editTarget, setEditTarget] = useState<{
    id: Id<'sections'>;
    name: string;
    room: string;
    capacity: string;
    displayName: string;
  } | null>(null);

  // ── Assign teacher ──
  const [assignTarget, setAssignTarget] = useState<{
    sectionId: Id<'sections'>;
    currentTeacherId?: Id<'staff'>;
  } | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');

  // ────────────────────────────────────────
  // Per-grade sections query hook component
  // ────────────────────────────────────────
  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-10">
      {/* ── Header ── */}
      <div className="space-y-1">
        <div className="flex flex-col flex-wrap items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm font-medium text-[#2D9B4E]">
              <span>Academics</span>
              <ChevronRight className="text-muted-foreground/50 h-3.5 w-3.5" />
              <span className="text-muted-foreground font-semibold">Class Sections</span>
            </div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-[#111827]">
              Class Sections
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-[#6B7280]">
              Manage class sections for each grade. Assign class teachers and set capacity limits.
            </p>
          </div>
          <Button
            onClick={() => {
              setAddForm({ gradeId: '', name: '', room: '', capacity: '' });
              setIsAddModalOpen(true);
            }}
            className="h-11 bg-[#2D9B4E] px-6 font-semibold hover:bg-[#217A3C]"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Section
          </Button>
        </div>
      </div>

      {/* ── No Academic Year Banner ── */}
      {activeYear === null && (
        <Card className="flex items-start gap-4 border-none bg-amber-50 p-5 ring-1 ring-amber-200">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-900">No active academic year</p>
            <p className="mt-0.5 text-sm text-amber-700">
              Activate an academic year before creating sections.{' '}
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

      {/* ── No Grades Banner ── */}
      {activeYear && grades.length === 0 && (
        <Card className="flex items-start gap-4 border-none bg-blue-50 p-5 ring-1 ring-blue-200">
          <LayoutGrid className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
          <div>
            <p className="font-semibold text-blue-900">No grades configured</p>
            <p className="mt-0.5 text-sm text-blue-700">
              You need at least one grade before you can add sections.{' '}
              <Link
                href="/academics/grades"
                className="underline underline-offset-2 hover:text-blue-900"
              >
                Configure grades →
              </Link>
            </p>
          </div>
        </Card>
      )}

      {/* ── Grade Rows ── */}
      {activeYear && grades.length > 0 && (
        <div className="space-y-10">
          {grades.map((grade) => (
            <GradeRow
              key={grade._id}
              grade={grade}
              academicYearId={activeYear._id}
              onAddSection={() => {
                setAddForm({
                  gradeId: grade._id,
                  name: '',
                  room: '',
                  capacity: '',
                });
                setIsAddModalOpen(true);
              }}
              onEditSection={(s) => {
                setEditTarget({
                  id: s._id,
                  name: s.name,
                  displayName: s.displayName,
                  room: s.room ?? '',
                  capacity: s.capacity?.toString() ?? '',
                });
                setIsEditModalOpen(true);
              }}
              onAssignTeacher={(s) => {
                setAssignTarget({
                  sectionId: s._id,
                  currentTeacherId: s.classTeacherId as Id<'staff'> | undefined,
                });
                setSelectedStaffId(s.classTeacherId ?? '');
                setIsTeacherModalOpen(true);
              }}
            />
          ))}
        </div>
      )}

      {/* ── Add Section Modal ── */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="overflow-hidden rounded-2xl border-none p-0 shadow-2xl sm:max-w-[460px]">
          <div className="bg-[#2D9B4E] p-6 pb-10 text-white">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <LayoutGrid className="h-5 w-5 text-white" />
              </div>
              <DialogTitle className="font-heading text-2xl font-bold">Add Section</DialogTitle>
            </div>
            <DialogDescription className="font-medium text-green-50/80">
              Create a new class section for a grade.
            </DialogDescription>
          </div>

          <div className="-mt-6 space-y-5 rounded-t-3xl bg-white p-6">
            {/* Grade selector */}
            <div className="space-y-2">
              <label className="px-1 text-xs font-bold tracking-wider text-gray-400 uppercase">
                Grade
              </label>
              <Select
                value={addForm.gradeId}
                onValueChange={(v) => v && setAddForm({ ...addForm, gradeId: v })}
              >
                <SelectTrigger className="h-12 rounded-xl border-gray-100 bg-gray-50 font-medium">
                  <SelectValue placeholder="Select grade..." />
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

            {/* Section name */}
            <div className="space-y-2">
              <label className="px-1 text-xs font-bold tracking-wider text-gray-400 uppercase">
                Section Name
              </label>
              <Input
                placeholder="e.g. A, B, Sciences, East"
                className="h-12 rounded-xl border-gray-100 bg-gray-50 font-medium transition-all focus:bg-white focus:ring-[#2D9B4E]/10"
                value={addForm.name}
                onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
              />
              <p className="px-1 text-xs text-gray-400">
                e.g. entering &quot;A&quot; for Grade 8 creates &quot;Grade 8A&quot;
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Room */}
              <div className="space-y-2">
                <label className="px-1 text-xs font-bold tracking-wider text-gray-400 uppercase">
                  Room (optional)
                </label>
                <Input
                  placeholder="e.g. 101, Block B"
                  className="h-12 rounded-xl border-gray-100 bg-gray-50 font-medium transition-all focus:bg-white focus:ring-[#2D9B4E]/10"
                  value={addForm.room}
                  onChange={(e) => setAddForm({ ...addForm, room: e.target.value })}
                />
              </div>

              {/* Capacity */}
              <div className="space-y-2">
                <label className="px-1 text-xs font-bold tracking-wider text-gray-400 uppercase">
                  Capacity (optional)
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 40"
                  className="h-12 rounded-xl border-gray-100 bg-gray-50 font-medium transition-all focus:bg-white focus:ring-[#2D9B4E]/10"
                  value={addForm.capacity}
                  onChange={(e) => setAddForm({ ...addForm, capacity: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                variant="ghost"
                onClick={() => setIsAddModalOpen(false)}
                className="h-12 px-6 font-semibold text-gray-500 hover:text-gray-900"
              >
                Cancel
              </Button>
              <Button
                onClick={async () => {
                  if (!addForm.gradeId) return toast.error('Please select a grade');
                  if (!addForm.name.trim()) return toast.error('Section name is required');
                  if (!activeYear) return toast.error('No active academic year');
                  try {
                    await createSection({
                      gradeId: addForm.gradeId as Id<'grades'>,
                      academicYearId: activeYear._id,
                      name: addForm.name.trim(),
                      room: addForm.room.trim() || undefined,
                      capacity: addForm.capacity ? parseInt(addForm.capacity) : undefined,
                    });
                    toast.success(`Section created`);
                    setIsAddModalOpen(false);
                    setAddForm({ gradeId: '', name: '', room: '', capacity: '' });
                  } catch (e) {
                    toast.error((e as Error).message || 'Failed to create section');
                  }
                }}
                className="h-12 rounded-xl bg-[#2D9B4E] px-8 font-bold text-white shadow-lg shadow-green-900/10 transition-all hover:bg-[#217A3C] active:scale-95"
              >
                Create Section
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Edit Section Modal ── */}
      {editTarget && (
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="overflow-hidden rounded-2xl border-none p-0 shadow-2xl sm:max-w-[460px]">
            <div className="bg-gray-900 p-6 pb-10 text-white">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                  <Edit2 className="h-5 w-5 text-white" />
                </div>
                <DialogTitle className="font-heading text-2xl font-bold">Edit Section</DialogTitle>
              </div>
              <DialogDescription className="font-medium text-gray-300">
                Update details for {editTarget.displayName}.
              </DialogDescription>
            </div>

            <div className="-mt-6 space-y-5 rounded-t-3xl bg-white p-6">
              <div className="space-y-2">
                <label className="px-1 text-xs font-bold tracking-wider text-gray-400 uppercase">
                  Section Name
                </label>
                <Input
                  placeholder="e.g. A, B, Sciences"
                  className="h-12 rounded-xl border-gray-100 bg-gray-50 font-medium transition-all focus:bg-white focus:ring-[#2D9B4E]/10"
                  value={editTarget.name}
                  onChange={(e) => setEditTarget({ ...editTarget, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="px-1 text-xs font-bold tracking-wider text-gray-400 uppercase">
                    Room
                  </label>
                  <Input
                    placeholder="e.g. 101"
                    className="h-12 rounded-xl border-gray-100 bg-gray-50 font-medium transition-all focus:bg-white focus:ring-[#2D9B4E]/10"
                    value={editTarget.room}
                    onChange={(e) => setEditTarget({ ...editTarget, room: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="px-1 text-xs font-bold tracking-wider text-gray-400 uppercase">
                    Capacity
                  </label>
                  <Input
                    type="number"
                    placeholder="e.g. 40"
                    className="h-12 rounded-xl border-gray-100 bg-gray-50 font-medium transition-all focus:bg-white focus:ring-[#2D9B4E]/10"
                    value={editTarget.capacity}
                    onChange={(e) => setEditTarget({ ...editTarget, capacity: e.target.value })}
                  />
                </div>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setIsEditModalOpen(false)}
                  className="h-12 px-6 font-semibold text-gray-500 hover:text-gray-900"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    if (!editTarget.name.trim()) return toast.error('Section name is required');
                    try {
                      await updateSection({
                        id: editTarget.id,
                        name: editTarget.name.trim(),
                        room: editTarget.room.trim() || undefined,
                        capacity: editTarget.capacity ? parseInt(editTarget.capacity) : undefined,
                      });
                      toast.success('Section updated');
                      setIsEditModalOpen(false);
                    } catch (e) {
                      toast.error((e as Error).message || 'Failed to update section');
                    }
                  }}
                  className="h-12 rounded-xl bg-gray-900 px-8 font-bold text-white shadow-lg transition-all hover:bg-gray-800 active:scale-95"
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ── Assign Teacher Modal ── */}
      {assignTarget && (
        <Dialog open={isTeacherModalOpen} onOpenChange={setIsTeacherModalOpen}>
          <DialogContent className="overflow-hidden rounded-2xl border-none p-0 shadow-2xl sm:max-w-[460px]">
            <div className="bg-blue-700 p-6 pb-10 text-white">
              <div className="mb-2 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                  <UserCheck className="h-5 w-5 text-white" />
                </div>
                <DialogTitle className="font-heading text-2xl font-bold">
                  Assign Class Teacher
                </DialogTitle>
              </div>
              <DialogDescription className="font-medium text-blue-100/80">
                Assign a teaching staff member as class teacher for this section.
              </DialogDescription>
            </div>

            <div className="-mt-6 space-y-5 rounded-t-3xl bg-white p-6">
              <div className="space-y-2">
                <label className="px-1 text-xs font-bold tracking-wider text-gray-400 uppercase">
                  Class Teacher
                </label>
                <StaffDropdown value={selectedStaffId} onChange={setSelectedStaffId} />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  variant="ghost"
                  onClick={() => {
                    // Allow clearing the teacher assignment
                    if (selectedStaffId) setSelectedStaffId('');
                    setIsTeacherModalOpen(false);
                  }}
                  className="h-12 px-6 font-semibold text-gray-500 hover:text-gray-900"
                >
                  Cancel
                </Button>
                <Button
                  onClick={async () => {
                    try {
                      await assignClassTeacher({
                        sectionId: assignTarget.sectionId,
                        staffId: selectedStaffId ? (selectedStaffId as Id<'staff'>) : undefined,
                      });
                      toast.success(
                        selectedStaffId ? 'Class teacher assigned' : 'Class teacher removed',
                      );
                      setIsTeacherModalOpen(false);
                    } catch (e) {
                      toast.error((e as Error).message || 'Failed to assign teacher');
                    }
                  }}
                  className="h-12 rounded-xl bg-blue-700 px-8 font-bold text-white shadow-lg transition-all hover:bg-blue-800 active:scale-95"
                >
                  {selectedStaffId ? 'Assign Teacher' : 'Remove Teacher'}
                </Button>
              </DialogFooter>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ─── Grade Row (per-grade sections query) ──────────────────────────────────

type SectionData = {
  _id: Id<'sections'>;
  name: string;
  displayName: string;
  room?: string;
  capacity?: number;
  classTeacherId?: string;
  enrolledCount?: number;
  classTeacher: { firstName: string; lastName: string } | null;
};

function GradeRow({
  grade,
  academicYearId,
  onAddSection,
  onEditSection,
  onAssignTeacher,
}: {
  grade: { _id: Id<'grades'>; name: string; level: number };
  academicYearId: Id<'academicYears'>;
  onAddSection: () => void;
  onEditSection: (s: SectionData) => void;
  onAssignTeacher: (s: SectionData) => void;
}) {
  const sections =
    useQuery(api.academics.sections.getSectionsByGrade, {
      gradeId: grade._id,
      academicYearId,
    }) ?? [];

  return (
    <div className="space-y-4">
      {/* Grade header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2D9B4E]/10">
            <LayoutGrid className="h-4 w-4 text-[#2D9B4E]" />
          </div>
          <div>
            <h3 className="font-heading text-lg font-bold text-gray-900">{grade.name}</h3>
            <p className="text-xs text-gray-400">
              {sections.length} section{sections.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={onAddSection}
          className="h-9 border-gray-200 px-4 text-sm font-semibold text-gray-600 hover:border-[#2D9B4E]/30 hover:bg-[#2D9B4E]/5 hover:text-[#2D9B4E]"
        >
          <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
          Add Section
        </Button>
      </div>

      {/* Section cards */}
      {sections.length === 0 ? (
        <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 text-center">
          <div className="space-y-1">
            <p className="text-sm font-medium text-gray-400">No sections yet</p>
            <p className="text-xs text-gray-300">Click &quot;Add Section&quot; to get started</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sections.map((section) => (
            <SectionCard
              key={section._id}
              section={section as SectionData}
              onEdit={() => onEditSection(section as SectionData)}
              onAssignTeacher={() => onAssignTeacher(section as SectionData)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Staff Dropdown (teaching staff only) ─────────────────────────────────

function StaffDropdown({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  // Note: Requires staff module to be built (Epic 5).
  // For now, returns empty — will auto-populate once staff backend is live.
  const staff: Array<{ _id: string; firstName: string; lastName: string; jobTitle: string }> = [];

  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? '')}>
      <SelectTrigger className="h-12 rounded-xl border-gray-100 bg-gray-50 font-medium">
        <SelectValue
          placeholder={staff.length === 0 ? 'No teaching staff added yet' : 'Select teacher...'}
        />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="">— Remove assignment —</SelectItem>
        {staff.map((s) => (
          <SelectItem key={s._id} value={s._id}>
            {s.firstName} {s.lastName} · {s.jobTitle}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
