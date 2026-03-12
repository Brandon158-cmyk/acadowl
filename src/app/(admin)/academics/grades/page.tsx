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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { PlusCircle, GraduationCap, ArrowUp, ArrowDown } from 'lucide-react';
import { Id } from '../../../../../convex/_generated/dataModel';

export default function GradesPage() {
  const grades = useQuery(api.academics.grades.getGradesBySchool) || [];
  const seedGrades = useMutation(api.academics.grades.seedDefaultGrades);
  const createGrade = useMutation(api.academics.grades.createGrade);
  const updateGrade = useMutation(api.academics.grades.updateGrade);

  const [isSeedLoading, setIsSeedLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [newGrade, setNewGrade] = useState({
    name: '',
    level: 1,
    stream: '',
    graduationGrade: false,
    order: 1,
  });

  const handleSeed = async () => {
    setIsSeedLoading(true);
    try {
      await seedGrades();
      toast.success('Successfully provisioned default grades');
    } catch (e) {
      toast.error((e as Error).message || 'Failed to provision grades');
    } finally {
      setIsSeedLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newGrade.name) return toast.error('Grade name is required');
    try {
      await createGrade({
        name: newGrade.name,
        level: newGrade.level,
        stream: newGrade.stream || undefined,
        graduationGrade: newGrade.graduationGrade,
        order: newGrade.order,
      });
      toast.success('Grade created');
      setIsCreateModalOpen(false);
      setNewGrade({
        name: '',
        level: newGrade.level + 1,
        stream: '',
        graduationGrade: false,
        order: newGrade.order + 1,
      });
    } catch (e) {
      toast.error((e as Error).message || 'Failed to create grade');
    }
  };

  const handleMove = async (id: Id<'grades'>, direction: 'up' | 'down', currentOrder: number) => {
    const targetOrder = direction === 'up' ? currentOrder - 1 : currentOrder + 1;
    // Simple up/down by swapping the order if we have it properly indexed,
    // or just modifying the order value directly for now.
    try {
      await updateGrade({ id, order: targetOrder });
    } catch {
      toast.error('Failed to change order');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Grades</h1>
          <p className="text-muted-foreground">Manage school grade levels and progression.</p>
        </div>
        <div className="flex items-center gap-2">
          {grades.length === 0 && (
            <Button variant="outline" onClick={handleSeed} disabled={isSeedLoading}>
              <GraduationCap className="mr-2 h-4 w-4" />
              Provision School Grades
            </Button>
          )}

          <Button onClick={() => setIsCreateModalOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Grade
          </Button>

          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Grade</DialogTitle>
                <DialogDescription>Create a new grade level for your school.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Grade Name</label>
                    <Input
                      placeholder="e.g. Grade 8"
                      value={newGrade.name}
                      onChange={(e) => setNewGrade({ ...newGrade, name: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Academic Level</label>
                    <Input
                      type="number"
                      value={newGrade.level}
                      onChange={(e) =>
                        setNewGrade({ ...newGrade, level: parseInt(e.target.value) || 1 })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Stream (Optional)</label>
                    <Input
                      placeholder="e.g. Science"
                      value={newGrade.stream}
                      onChange={(e) => setNewGrade({ ...newGrade, stream: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Sort Order</label>
                    <Input
                      type="number"
                      value={newGrade.order}
                      onChange={(e) =>
                        setNewGrade({ ...newGrade, order: parseInt(e.target.value) || 1 })
                      }
                    />
                  </div>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="graduationGrade"
                    checked={newGrade.graduationGrade}
                    onCheckedChange={(c) => setNewGrade({ ...newGrade, graduationGrade: !!c })}
                  />
                  <label htmlFor="graduationGrade" className="text-sm leading-none font-medium">
                    This is a graduation grade (end of phase)
                  </label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate}>Save Grade</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="bg-card rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Order</TableHead>
              <TableHead>Grade Name</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Stream</TableHead>
              <TableHead>Graduation Phase</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {grades.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-muted-foreground h-24 text-center">
                  No grades setup. Click &quot;Provision School Grades&quot; to auto-create based on
                  school type.
                </TableCell>
              </TableRow>
            ) : (
              grades.map((grade, index) => (
                <TableRow key={grade._id}>
                  <TableCell>
                    <div className="flex flex-col items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === 0}
                        onClick={() => handleMove(grade._id, 'up', grade.order)}
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <span className="text-muted-foreground text-xs">{grade.order}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        disabled={index === grades.length - 1}
                        onClick={() => handleMove(grade._id, 'down', grade.order)}
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <GraduationCap className="text-muted-foreground h-4 w-4" />
                      {grade.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="bg-muted inline-flex items-center rounded-md px-2 py-1 text-xs font-medium">
                      Level {grade.level}
                    </span>
                  </TableCell>
                  <TableCell>
                    {grade.stream ? (
                      <span className="bg-secondary inline-flex items-center rounded-md px-2 py-1 text-xs font-medium">
                        {grade.stream}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {grade.graduationGrade && (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-1 text-xs font-medium text-amber-700 ring-1 ring-amber-600/20 ring-inset dark:bg-amber-900/30 dark:text-amber-400">
                        Graduating Class
                      </span>
                    )}
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
