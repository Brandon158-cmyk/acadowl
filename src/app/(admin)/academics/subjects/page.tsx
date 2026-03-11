'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { PlusCircle, Download, BookOpen } from 'lucide-react';

export default function SubjectsPage() {
  const subjects = useQuery(api.academics.subjects.getSubjectsBySchool) || [];
  const grades = useQuery(api.academics.grades.getGradesBySchool) || [];
  const seedSubjects = useMutation(api.academics.subjects.seedDefaultSubjects);
  const createSubject = useMutation(api.academics.subjects.createSubject);
  const deactivateSubject = useMutation(api.academics.subjects.deactivateSubject);

  const [isSeedLoading, setIsSeedLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [newSubject, setNewSubject] = useState({
    name: '',
    code: '',
    isCompulsory: false,
    eczSubjectCode: '',
    gradeIds: [] as string[],
  });

  const handleSeed = async () => {
    setIsSeedLoading(true);
    try {
      await seedSubjects();
      toast.success('Successfully imported MoE subjects');
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to import subjects');
    } finally {
      setIsSeedLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newSubject.name) return toast.error('Subject name is required');
    if (newSubject.gradeIds.length === 0) return toast.error('Select at least one grade');
    try {
      await createSubject({
        name: newSubject.name,
        code: newSubject.code || undefined,
        isCompulsory: newSubject.isCompulsory,
        eczSubjectCode: newSubject.eczSubjectCode || undefined,
        gradeIds:
          newSubject.gradeIds as import('../../../../../convex/_generated/dataModel').Id<'grades'>[],
      });
      toast.success('Subject created');
      setIsCreateModalOpen(false);
      setNewSubject({
        name: '',
        code: '',
        isCompulsory: false,
        eczSubjectCode: '',
        gradeIds: [],
      });
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to create subject');
    }
  };

  const handleDeactivate = async (id: string, name: string) => {
    const confirmed = window.confirm(
      `Deactivate "${name}"? It will be hidden from new timetables and exams but historical data will be preserved.`,
    );
    if (!confirmed) return;
    try {
      await deactivateSubject({
        id: id as import('../../../../../convex/_generated/dataModel').Id<'subjects'>,
      });
      toast.success('Subject deactivated');
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to deactivate subject');
    }
  };

  // Group subjects by active/inactive.
  // Subjects with no gradeIds are considered 'inactive' / deactivated.
  const activeSubjects = subjects.filter((s) => s.gradeIds.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subjects</h1>
          <p className="text-muted-foreground">Manage school curriculum and MoE subjects.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSeed} disabled={isSeedLoading}>
            <Download className="mr-2 h-4 w-4" />
            Import MoE Defaults
          </Button>

          <Button onClick={() => setIsCreateModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Subject
          </Button>

          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Subject</DialogTitle>
                <DialogDescription>Create a new subject in the school registry.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Subject Name</label>
                  <Input
                    placeholder="e.g. Mathematics"
                    value={newSubject.name}
                    onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Internal Code</label>
                    <Input
                      placeholder="e.g. MATH"
                      value={newSubject.code}
                      onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">ECZ Code</label>
                    <Input
                      placeholder="e.g. 4024"
                      value={newSubject.eczSubjectCode}
                      onChange={(e) =>
                        setNewSubject({ ...newSubject, eczSubjectCode: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Grades</label>
                  <Select
                    onValueChange={(val) => {
                      if (!val) return;
                      const strVal = val as string;
                      setNewSubject((prev) => ({
                        ...prev,
                        gradeIds: prev.gradeIds.includes(strVal)
                          ? prev.gradeIds.filter((id) => id !== strVal)
                          : [...prev.gradeIds, strVal],
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select grades..." />
                    </SelectTrigger>
                    <SelectContent>
                      {grades.map((g) => (
                        <SelectItem key={g._id} value={g._id}>
                          {g.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {newSubject.gradeIds.map((id) => {
                      const g = grades.find((gr) => gr._id === id);
                      return g ? (
                        <span
                          key={id}
                          className="bg-primary/10 text-primary hover:bg-destructive/10 hover:text-destructive cursor-pointer rounded-full px-2 py-1 text-xs"
                          onClick={() =>
                            setNewSubject((prev) => ({
                              ...prev,
                              gradeIds: prev.gradeIds.filter((gid) => gid !== id),
                            }))
                          }
                        >
                          {g.name} &times;
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="isCompulsory"
                    checked={newSubject.isCompulsory}
                    onCheckedChange={(c) => setNewSubject({ ...newSubject, isCompulsory: !!c })}
                  />
                  <label
                    htmlFor="isCompulsory"
                    className="text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    This is a compulsory subject
                  </label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>Save Subject</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-card rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject Name</TableHead>
              <TableHead>Code</TableHead>
              <TableHead>Grades Taught</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeSubjects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground h-24 text-center">
                  No active subjects found. Click &quot;Import MoE Defaults&quot; or add manually.
                </TableCell>
              </TableRow>
            ) : (
              activeSubjects.map((subject) => (
                <TableRow key={subject._id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <BookOpen className="text-muted-foreground h-4 w-4" />
                      {subject.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    {subject.code && (
                      <span className="bg-muted ring-muted-foreground/20 inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset">
                        {subject.code}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {subject.gradeIds.slice(0, 3).map((gid) => {
                        const g = grades.find((gr) => gr._id === gid);
                        return g ? (
                          <span
                            key={gid}
                            className="bg-secondary inline-flex items-center rounded-md px-2 py-1 text-xs font-medium"
                          >
                            {g.name}
                          </span>
                        ) : null;
                      })}
                      {subject.gradeIds.length > 3 && (
                        <span className="bg-secondary inline-flex items-center rounded-md px-2 py-1 text-xs font-medium">
                          +{subject.gradeIds.length - 3} more
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {subject.isCompulsory ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-blue-700/10 ring-inset dark:bg-blue-900/30 dark:text-blue-400">
                        Compulsory
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-gray-500/10 ring-inset dark:bg-gray-800/50 dark:text-gray-400">
                        Optional
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDeactivate(subject._id, subject.name)}
                    >
                      Deactivate
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
