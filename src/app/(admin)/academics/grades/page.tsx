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
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  PlusCircle,
  GraduationCap,
  ArrowUp,
  ArrowDown,
  ChevronRight,
  ChevronLeft,
  Search,
  LayoutGrid,
  Filter,
  CheckCircle2,
  Trash2,
  Edit2,
  Settings,
} from 'lucide-react';
import { Doc, Id } from '../../../../../convex/_generated/dataModel';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function GradesPage() {
  const grades = useQuery(api.academics.grades.getGradesBySchool) || [];
  const seedGrades = useMutation(api.academics.grades.seedDefaultGrades);
  const createGrade = useMutation(api.academics.grades.createGrade);
  const updateGrade = useMutation(api.academics.grades.updateGrade);

  const [isSeedLoading, setIsSeedLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingGrade, setEditingGrade] = useState<Doc<'grades'> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [phaseFilter, setPhaseFilter] = useState<'all' | 'graduating' | 'non-graduating'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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
      if (editingGrade) {
        await updateGrade({
          id: editingGrade._id,
          name: newGrade.name,
          level: newGrade.level,
          stream: newGrade.stream || undefined,
          graduationGrade: newGrade.graduationGrade,
          order: newGrade.order,
        });
        toast.success('Grade updated');
      } else {
        await createGrade({
          name: newGrade.name,
          level: newGrade.level,
          stream: newGrade.stream || undefined,
          graduationGrade: newGrade.graduationGrade,
          order: newGrade.order,
        });
        toast.success('Grade created');
      }
      setIsCreateModalOpen(false);
      setEditingGrade(null);
      setNewGrade({
        name: '',
        level: newGrade.level + 1,
        stream: '',
        graduationGrade: false,
        order: newGrade.order + 1,
      });
    } catch (e) {
      toast.error((e as Error).message || 'Failed to save grade');
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

  const graduationClasses = grades.filter((g) => g.graduationGrade);
  const uniqueStreams = Array.from(new Set(grades.map((g) => g.stream).filter(Boolean)));

  // Filtering Logic
  const filteredGrades = grades.filter((g) => {
    const matchesSearch =
      g.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.stream?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesPhase =
      phaseFilter === 'all' ||
      (phaseFilter === 'graduating' && g.graduationGrade) ||
      (phaseFilter === 'non-graduating' && !g.graduationGrade);

    return matchesSearch && matchesPhase;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredGrades.length / itemsPerPage);
  const paginatedGrades = filteredGrades.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-10">
      {/* Breadcrumbs & Header */}
      <div className="space-y-1">
        <div className="flex flex-col flex-wrap items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm font-medium text-[#2D9B4E]">
              <span>Academics</span>
              <ChevronRight className="text-muted-foreground/50 h-3.5 w-3.5" />
              <span>School Configuration</span>
              <ChevronRight className="text-muted-foreground/50 h-3.5 w-3.5" />
              <span className="text-muted-foreground font-semibold">Grade Levels</span>
            </div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-[#111827]">
              School Grades
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-[#6B7280]">
              Manage your school&apos;s academic levels, streams, and student progression phases.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {grades.length === 0 && (
              <Button
                variant="outline"
                onClick={handleSeed}
                disabled={isSeedLoading}
                className="h-11 border-gray-200 px-6 font-semibold"
              >
                <GraduationCap className="mr-2 h-4 w-4 text-gray-500" />
                Provision Defaults
              </Button>
            )}

            <Button
              onClick={() => {
                setEditingGrade(null);
                setNewGrade({
                  name: '',
                  level: (grades[grades.length - 1]?.level || 0) + 1,
                  stream: '',
                  graduationGrade: false,
                  order: (grades[grades.length - 1]?.order || 0) + 1,
                });
                setIsCreateModalOpen(true);
              }}
              className="h-11 bg-[#2D9B4E] px-6 font-semibold hover:bg-[#217A3C]"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Grade
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="flex items-center gap-4 p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-[#2D9B4E]">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="font-jakarta text-xs font-semibold tracking-wider text-gray-500 uppercase">
              Grade Levels
            </p>
            <p className="font-lexend text-3xl font-bold text-gray-900">{grades.length}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <p className="font-jakarta text-xs font-semibold tracking-wider text-gray-500 uppercase">
              Graduation Classes
            </p>
            <p className="font-lexend text-3xl font-bold text-gray-900">
              {graduationClasses.length}
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <LayoutGrid className="h-6 w-6" />
          </div>
          <div>
            <p className="font-jakarta text-xs font-semibold tracking-wider text-gray-500 uppercase">
              Active Streams
            </p>
            <p className="font-lexend text-3xl font-bold text-gray-900">{uniqueStreams.length}</p>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        {/* Action Bar */}
        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search grades by name or stream..."
              className="h-11 rounded-xl border-gray-200 bg-white pl-11 shadow-none transition-all focus:border-[#2D9B4E] focus:ring-[#2D9B4E]/10"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select
              value={phaseFilter}
              onValueChange={(v) => {
                setPhaseFilter(v as 'all' | 'graduating' | 'non-graduating');
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-11 w-[180px] rounded-xl border-gray-200 bg-white text-sm font-medium shadow-none">
                <Filter className="mr-2 h-4 w-4 text-gray-400" />
                <SelectValue placeholder="All Phases" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Phases</SelectItem>
                <SelectItem value="graduating">Graduating Classes</SelectItem>
                <SelectItem value="non-graduating">Standard Grades</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Grades Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="font-jakarta w-24 py-4 font-semibold text-gray-900">
                  Sequence
                </TableHead>
                <TableHead className="font-jakarta py-4 font-semibold text-gray-900">
                  Grade Identity
                </TableHead>
                <TableHead className="font-jakarta py-4 font-semibold text-gray-900">
                  Academic Level
                </TableHead>
                <TableHead className="font-jakarta py-4 font-semibold text-gray-900">
                  Stream
                </TableHead>
                <TableHead className="font-jakarta py-4 font-semibold text-gray-900">
                  Status
                </TableHead>
                <TableHead className="font-jakarta py-4 text-right font-semibold text-gray-900">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedGrades.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="font-jakarta h-48 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                        <GraduationCap className="h-6 w-6 text-gray-300" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-900">No grades found</p>
                        <p className="text-sm">Try adjusting your filters or search query.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedGrades.map((grade, index) => (
                  <TableRow key={grade._id} className="group transition-colors hover:bg-gray-50/50">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex flex-col">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-[#2D9B4E]"
                            disabled={index === 0 && currentPage === 1}
                            onClick={() => handleMove(grade._id, 'up', grade.order)}
                          >
                            <ArrowUp className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-gray-400 hover:text-red-500"
                            disabled={
                              index === paginatedGrades.length - 1 && currentPage === totalPages
                            }
                            onClick={() => handleMove(grade._id, 'down', grade.order)}
                          >
                            <ArrowDown className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        <span className="font-mono text-sm font-bold text-gray-400">
                          {grade.order.toString().padStart(2, '0')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-400 transition-colors group-hover:bg-[#2D9B4E]/10 group-hover:text-[#2D9B4E]">
                          <GraduationCap className="h-5 w-5" />
                        </div>
                        <span className="font-jakarta font-semibold text-gray-900">
                          {grade.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge
                        variant="secondary"
                        className="bg-gray-100 font-bold text-gray-600 hover:bg-gray-200"
                      >
                        Level {grade.level}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      {grade.stream ? (
                        <Badge
                          variant="outline"
                          className="border-blue-100 bg-blue-50/50 font-bold text-blue-600"
                        >
                          {grade.stream}
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      {grade.graduationGrade ? (
                        <span className="font-jakarta inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                          <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          Graduating
                        </span>
                      ) : (
                        <span className="font-jakarta inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-bold text-[#2D9B4E]">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#2D9B4E]" />
                          Standard
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
                          onClick={() => {
                            setEditingGrade(grade);
                            setNewGrade({
                              name: grade.name,
                              level: grade.level,
                              stream: grade.stream || '',
                              graduationGrade: grade.graduationGrade,
                              order: grade.order,
                            });
                            setIsCreateModalOpen(true);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        {filteredGrades.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-4 px-2 sm:flex-row">
            <p className="text-sm text-gray-500">
              Showing{' '}
              <span className="font-semibold text-gray-900">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-gray-900">
                {Math.min(currentPage * itemsPerPage, filteredGrades.length)}
              </span>{' '}
              of <span className="font-semibold text-gray-900">{filteredGrades.length}</span> grades
            </p>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-lg border-gray-200"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button
                    key={i + 1}
                    variant={currentPage === i + 1 ? 'default' : 'outline'}
                    size="icon"
                    className={cn(
                      'h-9 w-9 rounded-lg',
                      currentPage === i + 1 ? 'bg-[#2D9B4E] hover:bg-[#217A3C]' : 'border-gray-200',
                    )}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 rounded-lg border-gray-200"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Redesigned Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="overflow-hidden rounded-2xl border-none p-0 shadow-2xl sm:max-w-[500px]">
          <div className="bg-[#2D9B4E] p-6 pb-10 text-white">
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
                <Settings className="h-5 w-5 text-white" />
              </div>
              <DialogTitle className="font-heading text-2xl font-bold">
                {editingGrade ? 'Edit Grade Level' : 'Configure New Grade'}
              </DialogTitle>
            </div>
            <DialogDescription className="font-medium text-green-50/80">
              Define the academic identity and progression rules for this grade.
            </DialogDescription>
          </div>

          <div className="-mt-6 space-y-6 rounded-t-3xl bg-white p-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="px-1 text-xs font-bold tracking-wider text-gray-400 uppercase">
                  Grade Name
                </label>
                <Input
                  placeholder="e.g. Grade 10, Year 1, JSS 1"
                  className="h-12 rounded-xl border-gray-100 bg-gray-50 font-medium transition-all focus:bg-white focus:ring-[#2D9B4E]/10"
                  value={newGrade.name}
                  onChange={(e) => setNewGrade({ ...newGrade, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="px-1 text-xs font-bold tracking-wider text-gray-400 uppercase">
                    Academic Level
                  </label>
                  <Input
                    type="number"
                    className="h-12 rounded-xl border-gray-100 bg-gray-50 font-medium transition-all focus:bg-white focus:ring-[#2D9B4E]/10"
                    value={newGrade.level}
                    onChange={(e) =>
                      setNewGrade({ ...newGrade, level: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="px-1 text-xs font-bold tracking-wider text-gray-400 uppercase">
                    Sort Order
                  </label>
                  <Input
                    type="number"
                    className="h-12 rounded-xl border-gray-100 bg-gray-50 font-medium transition-all focus:bg-white focus:ring-[#2D9B4E]/10"
                    value={newGrade.order}
                    onChange={(e) =>
                      setNewGrade({ ...newGrade, order: parseInt(e.target.value) || 1 })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="px-1 text-right text-xs font-bold tracking-wider text-gray-400 uppercase">
                  Academic Stream (Optional)
                </label>
                <Input
                  placeholder="e.g. Science, Arts, Commercial"
                  className="h-12 rounded-xl border-gray-100 bg-gray-50 font-medium transition-all focus:bg-white focus:ring-[#2D9B4E]/10"
                  value={newGrade.stream}
                  onChange={(e) => setNewGrade({ ...newGrade, stream: e.target.value })}
                />
              </div>

              <div
                className="group mt-2 flex cursor-pointer items-center justify-between rounded-xl border border-amber-100 bg-amber-50/50 p-4"
                onClick={() =>
                  setNewGrade({ ...newGrade, graduationGrade: !newGrade.graduationGrade })
                }
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-lg transition-colors',
                      newGrade.graduationGrade
                        ? 'bg-amber-100 text-amber-600'
                        : 'bg-gray-100 text-gray-400',
                    )}
                  >
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="mb-1 text-sm leading-none font-bold text-gray-900">
                      Graduation Phase
                    </h4>
                    <p className="text-xs text-gray-500">
                      Enable if students graduate after this grade.
                    </p>
                  </div>
                </div>
                <Checkbox
                  id="graduationGrade"
                  checked={newGrade.graduationGrade}
                  onCheckedChange={(c) => setNewGrade({ ...newGrade, graduationGrade: !!c })}
                  className="border-amber-200 data-[state=checked]:border-amber-500 data-[state=checked]:bg-amber-500"
                />
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                variant="ghost"
                onClick={() => setIsCreateModalOpen(false)}
                className="h-12 px-6 font-semibold text-gray-500 hover:text-gray-900"
              >
                Discard
              </Button>
              <Button
                onClick={handleCreate}
                className="h-12 rounded-xl bg-[#2D9B4E] px-8 font-bold text-white shadow-lg shadow-green-900/10 transition-all hover:bg-[#217A3C] active:scale-95"
              >
                {editingGrade ? 'Update Grade' : 'Save Grade Level'}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
