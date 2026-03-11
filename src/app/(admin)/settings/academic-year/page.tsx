'use client';

import { useState } from 'react';
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
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

// ────────────────────────────────────────
// Academic Year Settings Page (ISSUE-041 + ISSUE-042)
// ────────────────────────────────────────

export default function AcademicYearSettingsPage() {
  const { school, isLoading: isSchoolLoading } = useSchool();
  const academicYears = useQuery(api.schools.academicYears.getAcademicYears);

  const [expandedYearId, setExpandedYearId] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  if (isSchoolLoading || !school) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  const activeYear = academicYears?.find((y) => y.isActive);
  const hasNoActiveYear = academicYears !== undefined && !activeYear;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Academic Year & Terms"
        description="Manage the school's academic calendar. The active year and term drive all date-sensitive operations."
      >
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger render={<Button size="sm" />}>
            <Plus className="mr-2 h-4 w-4" />
            Create Academic Year
          </DialogTrigger>
          <CreateAcademicYearDialog onClose={() => setCreateDialogOpen(false)} />
        </Dialog>
      </PageHeader>

      {/* Warning banner when no academic year is active */}
      {hasNoActiveYear && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
          <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
          <div>
            <p className="font-medium">No active academic year</p>
            <p className="text-amber-800 dark:text-amber-300">
              Attendance, exams, and fee invoicing require an active academic year. Activate one
              below.
            </p>
          </div>
        </div>
      )}

      {/* Academic Years List */}
      {!academicYears ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
        </div>
      ) : academicYears.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="text-muted-foreground mb-4 h-12 w-12" />
            <p className="text-muted-foreground text-sm">
              No academic years created yet. Create your first academic year to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {academicYears.map((year) => {
            const isExpanded = expandedYearId === year._id;
            return (
              <AcademicYearCard
                key={year._id}
                year={year}
                isExpanded={isExpanded}
                isCurrent={school.currentAcademicYearId === year._id}
                onToggle={() => setExpandedYearId(isExpanded ? null : year._id)}
                academicMode={school.academicMode}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────
// Create Academic Year Dialog
// ────────────────────────────────────────

function CreateAcademicYearDialog({ onClose }: { onClose: () => void }) {
  const createYear = useMutation(api.schools.academicYears.createAcademicYear);
  const [loading, setLoading] = useState(false);
  const currentYear = new Date().getFullYear();

  const [form, setForm] = useState({
    year: currentYear,
    label: `${currentYear} Academic Year`,
    startDate: `${currentYear}-01-13`,
    endDate: `${currentYear}-12-06`,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createYear({
        year: form.year,
        label: form.label,
        startDate: form.startDate,
        endDate: form.endDate,
      });
      toast.success(`Academic year ${form.year} created.`);
      onClose();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to create academic year.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Create Academic Year</DialogTitle>
          <DialogDescription>
            Set up a new academic year. You can activate it once terms are configured.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                type="number"
                value={form.year}
                onChange={(e) =>
                  setForm({
                    ...form,
                    year: parseInt(e.target.value),
                    label: `${e.target.value} Academic Year`,
                  })
                }
                min={2020}
                max={2050}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="label">Label</Label>
              <Input
                id="label"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={form.startDate}
                onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={form.endDate}
                onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                required
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Year
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

// ────────────────────────────────────────
// Academic Year Card with Term Management
// ────────────────────────────────────────

interface AcademicYearCardProps {
  year: {
    _id: Id<'academicYears'>;
    year: number;
    label: string;
    startDate: string;
    endDate: string;
    isActive: boolean;
  };
  isExpanded: boolean;
  isCurrent: boolean;
  onToggle: () => void;
  academicMode: string;
}

function AcademicYearCard({
  year,
  isExpanded,
  isCurrent,
  onToggle,
  academicMode,
}: AcademicYearCardProps) {
  const activateYear = useMutation(api.schools.academicYears.activateAcademicYear);
  const closeYear = useMutation(api.schools.academicYears.closeAcademicYear);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleActivate = async () => {
    setActionLoading('activate');
    try {
      await activateYear({ academicYearId: year._id });
      toast.success(`${year.label} is now the active academic year.`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to activate.';
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleClose = async () => {
    setActionLoading('close');
    try {
      await closeYear({ academicYearId: year._id });
      toast.success(`${year.label} has been closed.`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to close.';
      toast.error(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('en-ZM', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

  return (
    <Card className={isCurrent ? 'ring-primary/30 ring-2' : ''}>
      <CardHeader className="cursor-pointer select-none" onClick={onToggle}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isExpanded ? (
              <ChevronDown className="text-muted-foreground h-4 w-4" />
            ) : (
              <ChevronRight className="text-muted-foreground h-4 w-4" />
            )}
            <div>
              <CardTitle className="text-base">{year.label}</CardTitle>
              <CardDescription>
                {formatDate(year.startDate)} — {formatDate(year.endDate)}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {year.isActive ? (
              <Badge variant="default" className="bg-emerald-600 text-white">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                Active
              </Badge>
            ) : (
              <Badge variant="outline">Closed</Badge>
            )}
            {!year.isActive && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleActivate();
                }}
                disabled={actionLoading === 'activate'}
              >
                {actionLoading === 'activate' ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <CheckCircle2 className="mr-1 h-3 w-3" />
                )}
                Activate
              </Button>
            )}
            {year.isActive && (
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  handleClose();
                }}
                disabled={actionLoading === 'close'}
              >
                {actionLoading === 'close' ? (
                  <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                ) : (
                  <XCircle className="mr-1 h-3 w-3" />
                )}
                Close Year
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="border-t pt-4">
          <TermsSection
            academicYearId={year._id}
            academicMode={academicMode}
            yearIsActive={year.isActive}
          />
        </CardContent>
      )}
    </Card>
  );
}

// ────────────────────────────────────────
// Terms Section (ISSUE-042)
// ────────────────────────────────────────

function TermsSection({
  academicYearId,
  academicMode,
  yearIsActive,
}: {
  academicYearId: Id<'academicYears'>;
  academicMode: string;
  yearIsActive: boolean;
}) {
  const terms = useQuery(api.schools.terms.getTermsByYear, { academicYearId });
  const createTerms = useMutation(api.schools.terms.createTerms);
  const activateTerm = useMutation(api.schools.terms.activateTerm);
  const [loading, setLoading] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  const handleActivateTerm = async (termId: Id<'terms'>) => {
    try {
      await activateTerm({ termId });
      toast.success('Term activated.');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to activate term.';
      toast.error(msg);
    }
  };

  const isSemester = academicMode === 'semester';
  const termLabel = isSemester ? 'Semester' : 'Term';

  /** Auto-generate default terms for quick setup. */
  const handleQuickSetup = async () => {
    setLoading(true);
    try {
      const defaultTerms = isSemester
        ? [
            { name: 'Semester 1', termNumber: 1, startDate: '', endDate: '' },
            { name: 'Semester 2', termNumber: 2, startDate: '', endDate: '' },
          ]
        : [
            { name: 'Term 1', termNumber: 1, startDate: '', endDate: '' },
            { name: 'Term 2', termNumber: 2, startDate: '', endDate: '' },
            { name: 'Term 3', termNumber: 3, startDate: '', endDate: '' },
          ];

      // We need dates — open the create dialog instead
      setCreateDialogOpen(true);
    } finally {
      setLoading(false);
    }
  };

  if (!terms) {
    return (
      <div className="flex h-16 items-center justify-center">
        <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
      </div>
    );
  }

  if (terms.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-muted-foreground text-sm">No {termLabel.toLowerCase()}s created yet.</p>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger render={<Button size="sm" variant="outline" />}>
            <Plus className="mr-2 h-3 w-3" />
            Create {termLabel}s
          </DialogTrigger>
          <CreateTermsDialog
            academicYearId={academicYearId}
            academicMode={academicMode}
            onClose={() => setCreateDialogOpen(false)}
          />
        </Dialog>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
        {termLabel}s
      </p>
      {terms.map((term) => {
        const formatDate = (d: string) =>
          new Date(d).toLocaleDateString('en-ZM', { day: 'numeric', month: 'short' });

        return (
          <div
            key={term._id}
            className="flex items-center justify-between rounded-md border px-3 py-2"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium">{term.name}</span>
              <span className="text-muted-foreground text-xs">
                {formatDate(term.startDate)} — {formatDate(term.endDate)}
              </span>
              {term.examStartDate && term.examEndDate && (
                <Badge variant="outline" className="text-xs">
                  Exams: {formatDate(term.examStartDate)} — {formatDate(term.examEndDate)}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              {term.isActive ? (
                <Badge variant="default" className="bg-emerald-600 text-white">
                  Active
                </Badge>
              ) : (
                <>
                  <Badge variant="outline">
                    {new Date(term.startDate) > new Date() ? 'Upcoming' : 'Closed'}
                  </Badge>
                  {yearIsActive && (
                    <Button size="sm" variant="ghost" onClick={() => handleActivateTerm(term._id)}>
                      Activate
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────
// Create Terms Dialog
// ────────────────────────────────────────

function CreateTermsDialog({
  academicYearId,
  academicMode,
  onClose,
}: {
  academicYearId: Id<'academicYears'>;
  academicMode: string;
  onClose: () => void;
}) {
  const createTerms = useMutation(api.schools.terms.createTerms);
  const [loading, setLoading] = useState(false);

  const isSemester = academicMode === 'semester';
  const defaultCount = isSemester ? 2 : 3;
  const termLabel = isSemester ? 'Semester' : 'Term';

  const [termForms, setTermForms] = useState(
    Array.from({ length: defaultCount }, (_, i) => ({
      name: `${termLabel} ${i + 1}`,
      termNumber: i + 1,
      startDate: '',
      endDate: '',
      examStartDate: '',
      examEndDate: '',
    })),
  );

  const updateTerm = (index: number, field: string, value: string) => {
    setTermForms((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const terms = termForms.map((t) => ({
        name: t.name,
        termNumber: t.termNumber,
        startDate: t.startDate,
        endDate: t.endDate,
        examStartDate: t.examStartDate || undefined,
        examEndDate: t.examEndDate || undefined,
      }));
      await createTerms({ academicYearId, terms });
      toast.success(`${termLabel}s created successfully.`);
      onClose();
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to create terms.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-lg">
      <form onSubmit={handleSubmit}>
        <DialogHeader>
          <DialogTitle>Create {termLabel}s</DialogTitle>
          <DialogDescription>
            Set up the date ranges for each {termLabel.toLowerCase()}.
            {isSemester
              ? ' Semester-based schools have exactly 2 semesters.'
              : ' Term-based schools typically have 3 terms.'}
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-80 space-y-4 overflow-y-auto py-4">
          {termForms.map((term, i) => (
            <div key={i} className="space-y-2 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">{term.name}</Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Start</Label>
                  <Input
                    type="date"
                    value={term.startDate}
                    onChange={(e) => updateTerm(i, 'startDate', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">End</Label>
                  <Input
                    type="date"
                    value={term.endDate}
                    onChange={(e) => updateTerm(i, 'endDate', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Exam Start (optional)</Label>
                  <Input
                    type="date"
                    value={term.examStartDate}
                    onChange={(e) => updateTerm(i, 'examStartDate', e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-muted-foreground text-xs">Exam End (optional)</Label>
                  <Input
                    type="date"
                    value={term.examEndDate}
                    onChange={(e) => updateTerm(i, 'examEndDate', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create {termLabel}s
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
