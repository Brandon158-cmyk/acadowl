'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
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
  ArrowUp,
  RotateCcw,
  GraduationCap,
  UserX,
  Loader2,
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronUp,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Id } from '../../../../../convex/_generated/dataModel';

// ── Action config ───────────────────────────────────────────────────────────

const ACTION_STYLES: Record<
  string,
  { bg: string; text: string; icon: React.ElementType; label: string }
> = {
  promote: { bg: 'bg-[#E8F5ED]', text: 'text-[#2D9B4E]', icon: ArrowUp, label: 'Promote' },
  repeat: { bg: 'bg-[#FFFBEB]', text: 'text-[#D97706]', icon: RotateCcw, label: 'Repeat' },
  graduate: {
    bg: 'bg-[#F5F3FF]',
    text: 'text-[#7C3AED]',
    icon: GraduationCap,
    label: 'Graduate',
  },
  withdraw: { bg: 'bg-[#FEF2F2]', text: 'text-[#DC2626]', icon: UserX, label: 'Withdraw' },
};

// ── Types ───────────────────────────────────────────────────────────────────

type PromotionAction = 'promote' | 'repeat' | 'graduate' | 'withdraw';

interface StudentAction {
  studentId: Id<'students'>;
  action: PromotionAction;
  toSectionId?: Id<'sections'>;
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function PromotionPage() {
  const [fromYearId, setFromYearId] = useState<string>('');
  const [toYearId, setToYearId] = useState<string>('');
  const [studentActions, setStudentActions] = useState<Map<string, StudentAction>>(new Map());
  const [expandedGrades, setExpandedGrades] = useState<Set<string>>(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // ── Data ──
  const academicYears = useQuery(api.schools.academicYears.getAcademicYears) ?? [];
  const bulkPromote = useMutation(api.students.promotions.bulkPromoteStudents);

  const promotionData = useQuery(
    api.students.promotions.preparePromotion,
    fromYearId && toYearId
      ? {
          fromAcademicYearId: fromYearId as Id<'academicYears'>,
          toAcademicYearId: toYearId as Id<'academicYears'>,
        }
      : 'skip',
  );

  // ── Initialize actions from suggestions ──
  const initializeActions = () => {
    if (!promotionData) return;
    const actions = new Map<string, StudentAction>();
    for (const grade of promotionData.grades) {
      for (const student of grade.students) {
        const defaultSection =
          student.suggestedAction === 'promote'
            ? student.nextGradeSections[0]?._id
            : student.suggestedAction === 'repeat'
              ? student.sameGradeSections[0]?._id
              : undefined;

        actions.set(student.studentId, {
          studentId: student.studentId,
          action: student.suggestedAction,
          toSectionId: defaultSection,
        });
      }
    }
    setStudentActions(actions);
    // Expand all grades
    setExpandedGrades(new Set(promotionData.grades.map((g) => g.gradeId)));
  };

  // ── Action setters ──
  const setAction = (studentId: string, action: PromotionAction) => {
    const current = studentActions.get(studentId);
    const newActions = new Map(studentActions);
    newActions.set(studentId, {
      studentId: studentId as Id<'students'>,
      action,
      toSectionId: current?.toSectionId,
    });
    setStudentActions(newActions);
  };

  const setSection = (studentId: string, sectionId: string) => {
    const current = studentActions.get(studentId);
    if (!current) return;
    const newActions = new Map(studentActions);
    newActions.set(studentId, {
      ...current,
      toSectionId: sectionId as Id<'sections'>,
    });
    setStudentActions(newActions);
  };

  const toggleGrade = (gradeId: string) => {
    const next = new Set(expandedGrades);
    if (next.has(gradeId)) next.delete(gradeId);
    else next.add(gradeId);
    setExpandedGrades(next);
  };

  // ── Summary stats ──
  const actionSummary = (() => {
    const counts = { promote: 0, repeat: 0, graduate: 0, withdraw: 0, noSection: 0 };
    for (const action of studentActions.values()) {
      counts[action.action]++;
      if ((action.action === 'promote' || action.action === 'repeat') && !action.toSectionId) {
        counts.noSection++;
      }
    }
    return counts;
  })();

  // ── Submit ──
  const handleSubmit = async () => {
    if (actionSummary.noSection > 0) {
      toast.error(
        `${actionSummary.noSection} student(s) need a target section assigned before promotion.`,
      );
      return;
    }

    setIsProcessing(true);
    try {
      const actions = Array.from(studentActions.values()).map((a) => ({
        studentId: a.studentId,
        action: a.action,
        toSectionId: a.toSectionId,
      }));

      const result = await bulkPromote({
        toAcademicYearId: toYearId as Id<'academicYears'>,
        actions,
      });

      toast.success(
        `Promotion complete: ${result.promoted} promoted, ${result.repeated} repeated, ${result.graduated} graduated, ${result.withdrawn} withdrawn` +
          (result.skipped > 0 ? `, ${result.skipped} skipped` : ''),
      );
      setShowConfirmDialog(false);
      setStudentActions(new Map());
      setFromYearId('');
      setToYearId('');
    } catch (error: any) {
      toast.error(error.data ?? 'Failed to process promotion');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-10">
      {/* ── Header ── */}
      <div>
        <Breadcrumb className="mb-1">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/students" />} className="text-sm font-medium text-[#2D9B4E]">
                Students
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-sm font-semibold text-gray-500">
                Year-End Promotion
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-[#111827]">
          Year-End Promotion
        </h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Promote, repeat, or graduate students from one academic year to the next.
        </p>
      </div>

      {/* ── Year Selection ── */}
      <Card className="border-none p-6 shadow-sm ring-1 ring-gray-100">
        <h2 className="mb-4 font-heading text-lg font-semibold text-[#111827]">
          Select Academic Years
        </h2>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-medium text-[#374151]">From (Source Year)</Label>
            <Select
              value={fromYearId}
              onValueChange={(val) => {
                setFromYearId(val);
                setStudentActions(new Map());
              }}
            >
              <SelectTrigger className="h-[48px] w-[240px] rounded-lg border-[1.5px] border-[#D1D5DB] text-sm">
                <SelectValue placeholder="Select source year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears.map((y) => (
                  <SelectItem key={y._id} value={y._id}>
                    {y.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ChevronRight className="hidden h-5 w-5 text-gray-300 sm:block" />

          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-medium text-[#374151]">To (Target Year)</Label>
            <Select
              value={toYearId}
              onValueChange={(val) => {
                setToYearId(val);
                setStudentActions(new Map());
              }}
            >
              <SelectTrigger className="h-[48px] w-[240px] rounded-lg border-[1.5px] border-[#D1D5DB] text-sm">
                <SelectValue placeholder="Select target year" />
              </SelectTrigger>
              <SelectContent>
                {academicYears
                  .filter((y) => y._id !== fromYearId)
                  .map((y) => (
                    <SelectItem key={y._id} value={y._id}>
                      {y.label}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {fromYearId && toYearId && promotionData && studentActions.size === 0 && (
            <Button
              onClick={initializeActions}
              className="h-[48px] bg-[#2D9B4E] px-6 font-semibold shadow-sm hover:bg-[#217A3C]"
            >
              Load Students
            </Button>
          )}
        </div>
      </Card>

      {/* ── No Target Sections Warning ── */}
      {promotionData && !promotionData.targetSectionsAvailable && (
        <Card className="flex items-start gap-4 border-none bg-amber-50 p-5 ring-1 ring-amber-200">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-900">No sections in target year</p>
            <p className="mt-0.5 text-sm text-amber-700">
              Create sections for the target academic year before promoting students.{' '}
              <Link
                href="/academics/sections"
                className="underline underline-offset-2 hover:text-amber-900"
              >
                Manage sections →
              </Link>
            </p>
          </div>
        </Card>
      )}

      {/* ── Summary Bar ── */}
      {studentActions.size > 0 && (
        <Card className="flex flex-wrap items-center justify-between gap-4 border-none p-4 shadow-sm ring-1 ring-gray-100">
          <div className="flex flex-wrap gap-4">
            {Object.entries(ACTION_STYLES).map(([key, style]) => {
              const count = actionSummary[key as PromotionAction];
              const Icon = style.icon;
              return (
                <div key={key} className="flex items-center gap-2">
                  <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', style.bg)}>
                    <Icon className={cn('h-3.5 w-3.5', style.text)} />
                  </div>
                  <span className="text-sm text-[#374151]">
                    <strong>{count}</strong> {style.label}
                  </span>
                </div>
              );
            })}
          </div>
          <Button
            onClick={() => setShowConfirmDialog(true)}
            disabled={actionSummary.noSection > 0}
            className="bg-[#2D9B4E] font-semibold shadow-sm hover:bg-[#217A3C]"
          >
            <Check className="mr-2 h-4 w-4" />
            Process Promotion
          </Button>
        </Card>
      )}

      {/* ── Grade-by-Grade Review ── */}
      {promotionData &&
        studentActions.size > 0 &&
        promotionData.grades.map((grade) => {
          const isExpanded = expandedGrades.has(grade.gradeId);
          const gradeStudentCount = grade.students.length;

          return (
            <Card key={grade.gradeId} className="border-none shadow-sm ring-1 ring-gray-100">
              {/* Grade Header */}
              <Button
                variant="ghost"
                onClick={() => toggleGrade(grade.gradeId)}
                className="flex h-auto w-full items-center justify-between rounded-none px-5 py-4 text-left transition-colors hover:bg-[#F9FAFB]"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2D9B4E]/10">
                    <GraduationCap className="h-4.5 w-4.5 text-[#2D9B4E]" />
                  </div>
                  <div>
                    <h3 className="font-heading text-[15px] font-semibold text-[#111827]">
                      {grade.gradeName}
                    </h3>
                    <p className="text-[12px] text-[#6B7280]">{gradeStudentCount} students</p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4 text-[#9CA3AF]" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-[#9CA3AF]" />
                )}
              </Button>

              {/* Student Rows */}
              {isExpanded && (
                <div className="border-t border-[#F3F4F6]">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-[#F9FAFB] hover:bg-[#F9FAFB]">
                          <TableHead className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6B7280]">
                            Student
                          </TableHead>
                          <TableHead className="px-5 py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6B7280]">
                            Avg Score
                          </TableHead>
                          <TableHead className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6B7280]">
                            Action
                          </TableHead>
                          <TableHead className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6B7280]">
                            Target Section
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {grade.students.map((student) => {
                          const action = studentActions.get(student.studentId);
                          const currentAction = action?.action ?? student.suggestedAction;
                          const style = ACTION_STYLES[currentAction];

                          const availableSections =
                            currentAction === 'promote'
                              ? student.nextGradeSections
                              : currentAction === 'repeat'
                                ? student.sameGradeSections
                                : [];

                          return (
                            <TableRow
                              key={student.studentId}
                              className="border-b border-[#F3F4F6]"
                            >
                              <TableCell className="px-5 py-3">
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-8 w-8">
                                    {student.photoUrl ? (
                                      <AvatarImage src={student.photoUrl} alt="" />
                                    ) : null}
                                    <AvatarFallback className="bg-[#F3F4F6] text-xs font-semibold text-[#6B7280]">
                                      {student.firstName.charAt(0)}
                                      {student.lastName.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <p className="text-[13px] font-medium text-[#111827]">
                                      {student.firstName} {student.lastName}
                                    </p>
                                    <p className="font-mono text-[11px] text-[#9CA3AF]">
                                      {student.studentNumber}
                                    </p>
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell className="px-5 py-3 text-center">
                                {student.averageScore !== null ? (
                                  <span
                                    className={cn(
                                      'font-mono text-[13px] font-semibold',
                                      student.averageScore >= 60
                                        ? 'text-[#2D9B4E]'
                                        : student.averageScore >= 40
                                          ? 'text-[#D97706]'
                                          : 'text-[#DC2626]',
                                    )}
                                  >
                                    {student.averageScore}%
                                  </span>
                                ) : (
                                  <span className="text-[12px] text-[#9CA3AF]">N/A</span>
                                )}
                              </TableCell>
                              <TableCell className="px-5 py-3">
                                <Select
                                  value={currentAction}
                                  onValueChange={(val) =>
                                    setAction(student.studentId, val as PromotionAction)
                                  }
                                >
                                  <SelectTrigger
                                    className={cn(
                                      'h-8 w-[130px] rounded-lg border-0 text-[12px] font-semibold',
                                      style.bg,
                                      style.text,
                                    )}
                                  >
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="promote">Promote</SelectItem>
                                    <SelectItem value="repeat">Repeat</SelectItem>
                                    {student.isGraduationGrade && (
                                      <SelectItem value="graduate">Graduate</SelectItem>
                                    )}
                                    <SelectItem value="withdraw">Withdraw</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell className="px-5 py-3">
                                {(currentAction === 'promote' || currentAction === 'repeat') &&
                                availableSections.length > 0 ? (
                                  <Select
                                    value={action?.toSectionId ?? ''}
                                    onValueChange={(val) => setSection(student.studentId, val)}
                                  >
                                    <SelectTrigger className="h-8 w-[160px] rounded-lg border-gray-200 text-[12px]">
                                      <SelectValue placeholder="Select section" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {availableSections.map((s) => (
                                        <SelectItem key={s._id} value={s._id}>
                                          {s.displayName}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                ) : (currentAction === 'promote' || currentAction === 'repeat') &&
                                  availableSections.length === 0 ? (
                                  <span className="text-[12px] text-[#DC2626]">
                                    No sections available
                                  </span>
                                ) : (
                                  <span className="text-[12px] text-[#9CA3AF]">—</span>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              )}
            </Card>
          );
        })}

      {/* ── Empty state ── */}
      {fromYearId && toYearId && promotionData && promotionData.totalStudents === 0 && (
        <Card className="flex flex-col items-center gap-3 border-none p-12 text-center shadow-sm ring-1 ring-gray-100">
          <GraduationCap className="h-12 w-12 text-gray-200" />
          <p className="text-sm font-medium text-[#6B7280]">
            No active students found in the source academic year
          </p>
        </Card>
      )}

      {/* ── Confirm Dialog ── */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-lg rounded-2xl p-8">
          <DialogTitle className="font-heading text-xl font-semibold text-[#111827]">
            Confirm Year-End Promotion
          </DialogTitle>
          <DialogDescription className="text-sm text-[#6B7280]">
            You are about to process the following actions. This cannot be easily undone.
          </DialogDescription>

          <div className="mt-4 space-y-3">
            {Object.entries(ACTION_STYLES).map(([key, style]) => {
              const count = actionSummary[key as PromotionAction];
              if (count === 0) return null;
              const Icon = style.icon;
              return (
                <div
                  key={key}
                  className={cn('flex items-center gap-3 rounded-lg p-3', style.bg)}
                >
                  <Icon className={cn('h-5 w-5', style.text)} />
                  <span className={cn('text-sm font-semibold', style.text)}>
                    {count} student{count !== 1 ? 's' : ''} will be{' '}
                    {key === 'promote'
                      ? 'promoted'
                      : key === 'repeat'
                        ? 'repeated'
                        : key === 'graduate'
                          ? 'graduated'
                          : 'withdrawn'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            <strong>Warning:</strong> Ensure all section assignments are correct. Once processed,
            students will be moved to the new academic year.
          </div>

          <DialogFooter className="mt-6 gap-3">
            <Button variant="ghost" onClick={() => setShowConfirmDialog(false)} className="text-[#6B7280]">
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isProcessing}
              className="bg-[#2D9B4E] font-semibold hover:bg-[#217A3C]"
            >
              {isProcessing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Check className="mr-2 h-4 w-4" />
              )}
              Confirm & Process
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
