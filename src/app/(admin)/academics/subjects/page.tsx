'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { Id } from '../../../../../convex/_generated/dataModel';
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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  PlusCircle,
  Download,
  BookOpen,
  ChevronsUpDown,
  Search,
  BookMarked,
  LayoutGrid,
  ShieldCheck,
  ChevronRight,
  Home,
  ArrowUpDown,
  ChevronLeft,
  Filter,
  MoreVertical,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function SubjectsPage() {
  const subjects = useQuery(api.academics.subjects.getSubjectsBySchool) || [];
  const grades = useQuery(api.academics.grades.getGradesBySchool) || [];
  const seedSubjects = useMutation(api.academics.subjects.seedDefaultSubjects);
  const createSubject = useMutation(api.academics.subjects.createSubject);
  const deactivateSubject = useMutation(api.academics.subjects.deactivateSubject);

  const [isSeedLoading, setIsSeedLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const [newSubject, setNewSubject] = useState<{
    name: string;
    code: string;
    isCompulsory: boolean;
    eczSubjectCode: string;
    gradeIds: Id<'grades'>[];
  }>({
    name: '',
    code: '',
    isCompulsory: false,
    eczSubjectCode: '',
    gradeIds: [],
  });

  // Advanced Table State
  const [sortConfig, setSortConfig] = useState<{
    key: 'name' | 'code';
    direction: 'asc' | 'desc';
  } | null>(null);
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [requirementFilter, setRequirementFilter] = useState<'all' | 'compulsory' | 'optional'>(
    'all',
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [subjectToDeactivate, setSubjectToDeactivate] = useState<{
    id: Id<'subjects'>;
    name: string;
  } | null>(null);

  const handleSeed = async () => {
    setIsSeedLoading(true);
    try {
      const result = await seedSubjects();
      if (result && result.created > 0) {
        toast.success(`Successfully imported ${result.created} MoE subject(s)`);
      } else if (result && result.message) {
        toast.info(result.message);
      } else if (result && result.created === 0) {
        toast.info('All default subjects are already present — nothing to import.');
      } else {
        toast.success('Successfully imported MoE subjects');
      }
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
        gradeIds: newSubject.gradeIds,
      });
      toast.success('Subject created');
      setIsCreateModalOpen(false);
      setNewSubject({
        name: '',
        code: '',
        isCompulsory: false,
        eczSubjectCode: '',
        gradeIds: [] as Id<'grades'>[],
      });
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to create subject');
    }
  };

  const handleDeactivate = async () => {
    if (!subjectToDeactivate) return;
    try {
      await deactivateSubject({
        id: subjectToDeactivate.id,
      });
      toast.success('Subject deactivated');
      setSubjectToDeactivate(null);
    } catch (e: unknown) {
      toast.error((e as Error).message || 'Failed to deactivate subject');
    }
  };

  const activeSubjects = subjects.filter((s) => s.gradeIds.length > 0);

  // Filtering Logic
  const filteredSubjects = activeSubjects.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.eczSubjectCode?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGrade = gradeFilter === 'all' || s.gradeIds.includes(gradeFilter as Id<'grades'>);

    const matchesRequirement =
      requirementFilter === 'all' ||
      (requirementFilter === 'compulsory' && s.isCompulsory) ||
      (requirementFilter === 'optional' && !s.isCompulsory);

    return matchesSearch && matchesGrade && matchesRequirement;
  });

  // Sorting Logic
  const sortedSubjects = [...filteredSubjects].sort((a, b) => {
    if (!sortConfig) return 0;
    const { key, direction } = sortConfig;
    const aValue = a[key] || '';
    const bValue = b[key] || '';

    if (aValue < bValue) return direction === 'asc' ? -1 : 1;
    if (aValue > bValue) return direction === 'asc' ? 1 : -1;
    return 0;
  });

  // Pagination Logic
  const totalPages = Math.ceil(sortedSubjects.length / itemsPerPage);
  const paginatedSubjects = sortedSubjects.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleSort = (key: 'name' | 'code') => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' };
      }
      return { key, direction: 'asc' };
    });
  };

  const compulsoryCount = activeSubjects.filter((s) => s.isCompulsory).length;
  const uniqueGradesCount = new Set(activeSubjects.flatMap((s) => s.gradeIds)).size;

  return (
    <div className="mx-auto max-w-7xl space-y-10 pb-10">
      {/* Breadcrumbs & Header */}
      <div className="space-y-4">
        <nav className="flex items-center gap-2 text-sm font-medium text-gray-500">
          <Home className="h-4 w-4" />
          <ChevronRight className="h-4 w-4" />
          <span>Academics</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900">Subjects</span>
        </nav>

        <div className="flex flex-col flex-wrap items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h1 className="font-lexend text-3xl font-bold tracking-tight text-gray-900 md:text-4xl">
              Curriculum Subjects
            </h1>
            <p className="font-jakarta mt-2 max-w-2xl text-base text-gray-500">
              Manage your school&apos;s official curriculum, MoE subjects, and grade-specific
              mappings.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              onClick={handleSeed}
              disabled={isSeedLoading}
              className="h-11 border-gray-200 px-6 font-semibold"
            >
              <Download className="mr-2 h-4 w-4 text-gray-500" />
              Import MoE Defaults
            </Button>

            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="h-11 bg-[#2D9B4E] px-6 font-semibold hover:bg-[#217A3C]"
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Add New Subject
            </Button>
          </div>
        </div>
      </div>

      {/* KPI Stats Row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="flex items-center gap-4 p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-[#2D9B4E]">
            <BookMarked className="h-6 w-6" />
          </div>
          <div>
            <p className="font-jakarta text-xs font-semibold tracking-wider text-gray-500 uppercase">
              Total Subjects
            </p>
            <p className="font-lexend text-3xl font-bold text-gray-900">{activeSubjects.length}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="font-jakarta text-xs font-semibold tracking-wider text-gray-500 uppercase">
              Compulsory
            </p>
            <p className="font-lexend text-3xl font-bold text-gray-900">{compulsoryCount}</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-6 shadow-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
            <LayoutGrid className="h-6 w-6" />
          </div>
          <div>
            <p className="font-jakarta text-xs font-semibold tracking-wider text-gray-500 uppercase">
              Grades Covered
            </p>
            <p className="font-lexend text-3xl font-bold text-gray-900">{uniqueGradesCount}</p>
          </div>
        </Card>
      </div>

      {/* Main Content Area */}
      <div className="space-y-6">
        {/* Action Bar */}
        <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search subjects by name or code..."
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
              value={gradeFilter}
              onValueChange={(v) => {
                if (v) setGradeFilter(v);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-11 w-[160px] rounded-xl border-gray-200 bg-white shadow-none">
                <Filter className="mr-2 h-4 w-4 text-gray-400" />
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {grades.map((g) => (
                  <SelectItem key={g._id} value={g._id}>
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={requirementFilter}
              onValueChange={(v) => {
                setRequirementFilter(v as 'all' | 'compulsory' | 'optional');
                setCurrentPage(1);
              }}
            >
              <SelectTrigger className="h-11 w-[160px] rounded-xl border-gray-200 bg-white shadow-none">
                <ShieldCheck className="mr-2 h-4 w-4 text-gray-400" />
                <SelectValue placeholder="Requirement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Requirement</SelectItem>
                <SelectItem value="compulsory">Compulsory</SelectItem>
                <SelectItem value="optional">Optional</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Subjects Table */}
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <Table>
            <TableHeader className="bg-gray-50/50">
              <TableRow className="hover:bg-transparent">
                <TableHead
                  className="font-jakarta cursor-pointer py-4 font-semibold text-gray-900 transition-colors hover:text-[#2D9B4E]"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    Subject Name
                    <ArrowUpDown
                      className={cn(
                        'h-4 w-4 text-gray-400 transition-colors',
                        sortConfig?.key === 'name' && 'text-[#2D9B4E]',
                      )}
                    />
                  </div>
                </TableHead>
                <TableHead
                  className="font-jakarta cursor-pointer py-4 font-semibold text-gray-900 transition-colors hover:text-[#2D9B4E]"
                  onClick={() => handleSort('code')}
                >
                  <div className="flex items-center gap-2">
                    Internal Code
                    <ArrowUpDown
                      className={cn(
                        'h-4 w-4 text-gray-400 transition-colors',
                        sortConfig?.key === 'code' && 'text-[#2D9B4E]',
                      )}
                    />
                  </div>
                </TableHead>
                <TableHead className="font-jakarta py-4 font-semibold text-gray-900">
                  Grades Taught
                </TableHead>
                <TableHead className="font-jakarta py-4 font-semibold text-gray-900">
                  ECZ Code
                </TableHead>
                <TableHead className="font-jakarta py-4 font-semibold text-gray-900">
                  Requirement
                </TableHead>
                <TableHead className="font-jakarta py-4 text-right font-semibold text-gray-900">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSubjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="font-jakarta h-48 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-50">
                        <BookOpen className="h-6 w-6 text-gray-300" />
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold text-gray-900">No subjects found</p>
                        <p className="text-sm">Try adjusting your filters or search query.</p>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSubjects.map((subject) => (
                  <TableRow
                    key={subject._id}
                    className="group transition-colors hover:bg-gray-50/50"
                  >
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-100 text-gray-400 transition-colors group-hover:bg-[#2D9B4E]/10 group-hover:text-[#2D9B4E]">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <span className="font-jakarta font-semibold text-gray-900">
                          {subject.name}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      {subject.code ? (
                        <code className="rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 font-mono text-xs font-medium text-gray-600">
                          {subject.code}
                        </code>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {subject.gradeIds.slice(0, 3).map((gid) => {
                          const g = grades.find((gr) => gr._id === gid);
                          return g ? (
                            <Badge
                              key={gid}
                              variant="outline"
                              className="font-jakarta border-gray-200 bg-white font-medium text-gray-600"
                            >
                              {g.name}
                            </Badge>
                          ) : null;
                        })}
                        {subject.gradeIds.length > 3 && (
                          <Badge
                            variant="secondary"
                            className="font-jakarta bg-gray-100 text-gray-500"
                          >
                            +{subject.gradeIds.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      {subject.eczSubjectCode ? (
                        <span className="font-jakarta text-sm text-gray-500">
                          {subject.eczSubjectCode}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      {subject.isCompulsory ? (
                        <span className="font-jakarta inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-bold text-[#2D9B4E]">
                          <div className="h-1.5 w-1.5 rounded-full bg-[#2D9B4E]" />
                          Compulsory
                        </span>
                      ) : (
                        <span className="font-jakarta inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-500">
                          <div className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                          Optional
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-9 w-9 rounded-lg p-0 text-gray-400 hover:bg-red-50 hover:text-red-600"
                        onClick={() =>
                          setSubjectToDeactivate({ id: subject._id, name: subject.name })
                        }
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Footer */}
        {filteredSubjects.length > 0 && (
          <div className="flex flex-col items-center justify-between gap-4 px-2 sm:flex-row">
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <p>
                Showing{' '}
                <span className="font-semibold text-gray-900">
                  {(currentPage - 1) * itemsPerPage + 1}
                </span>{' '}
                to{' '}
                <span className="font-semibold text-gray-900">
                  {Math.min(currentPage * itemsPerPage, filteredSubjects.length)}
                </span>{' '}
                of <span className="font-semibold text-gray-900">{filteredSubjects.length}</span>{' '}
                subjects
              </p>

              <div className="flex items-center gap-2">
                <span className="shrink-0">Rows per page:</span>
                <Select
                  value={String(itemsPerPage)}
                  onValueChange={(v) => {
                    setItemsPerPage(Number(v));
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger className="h-9 w-[70px] border-gray-200 shadow-none focus:ring-0">
                    <SelectValue placeholder={itemsPerPage} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 rounded-lg p-0"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                    pageNum = currentPage - 3 + i;
                    if (pageNum + 4 > totalPages) pageNum = totalPages - 4;
                  }
                  if (pageNum < 1) pageNum = 1;
                  if (pageNum > totalPages) return null;

                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? 'default' : 'outline'}
                      size="sm"
                      className={cn(
                        'h-9 w-9 rounded-lg p-0',
                        currentPage === pageNum
                          ? 'bg-[#2D9B4E] hover:bg-[#217A3C]'
                          : 'border-gray-200',
                      )}
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-9 w-9 rounded-lg p-0"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Add Subject Dialog */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-xl gap-0 border-none p-0 shadow-2xl">
          <div className="bg-[#2D9B4E] p-8 text-white">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md">
                <PlusCircle className="h-8 w-8 text-white" />
              </div>
              <div>
                <DialogTitle className="font-lexend text-2xl font-bold">
                  New Curriculum Subject
                </DialogTitle>
                <DialogDescription className="mt-1 text-green-50/80">
                  Register a new subject into the school curriculum registry.
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="font-jakarta space-y-6 bg-white p-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="col-span-2 space-y-2">
                <label className="text-sm font-bold text-gray-700">
                  Subject Name <span className="text-red-500">*</span>
                </label>
                <div className="group relative">
                  <BookOpen className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-[#2D9B4E]" />
                  <Input
                    placeholder="e.g. Mathematics"
                    className="h-12 rounded-xl border-gray-200 pl-11 shadow-none transition-all focus:border-[#2D9B4E] focus:ring-[#2D9B4E]/10"
                    value={newSubject.name}
                    onChange={(e) => setNewSubject({ ...newSubject, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Internal Code</label>
                <Input
                  placeholder="e.g. MATH"
                  className="h-12 rounded-xl border-gray-200 shadow-none transition-all focus:border-[#2D9B4E] focus:ring-[#2D9B4E]/10"
                  value={newSubject.code}
                  onChange={(e) => setNewSubject({ ...newSubject, code: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">ECZ Subject Code</label>
                <Input
                  placeholder="e.g. 4024"
                  className="h-12 rounded-xl border-gray-200 shadow-none transition-all focus:border-[#2D9B4E] focus:ring-[#2D9B4E]/10"
                  value={newSubject.eczSubjectCode}
                  onChange={(e) => setNewSubject({ ...newSubject, eczSubjectCode: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-bold text-gray-700">
                Grade Assignment <span className="text-red-500">*</span>
              </label>
              <Popover>
                <PopoverTrigger>
                  <Button
                    variant="outline"
                    className="h-12 w-full justify-between rounded-xl border-gray-200 bg-white font-normal text-gray-600 shadow-none hover:bg-gray-50 hover:text-gray-900"
                  >
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="h-4 w-4 text-gray-400" />
                      {newSubject.gradeIds.length === 0
                        ? 'Select grades to teach this subject...'
                        : `${newSubject.gradeIds.length} Grade(s) Selected`}
                    </div>
                    <ChevronsUpDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-(--radix-popover-trigger-width) rounded-xl p-2 shadow-xl"
                  align="start"
                >
                  <div className="font-jakarta max-h-60 space-y-0.5 overflow-y-auto pr-1">
                    {grades.map((g) => {
                      const isSelected = newSubject.gradeIds.includes(g._id);
                      return (
                        <div
                          key={g._id}
                          className={cn(
                            'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-all',
                            isSelected ? 'bg-green-50' : 'hover:bg-gray-50',
                          )}
                          onClick={() =>
                            setNewSubject((prev) => ({
                              ...prev,
                              gradeIds: isSelected
                                ? prev.gradeIds.filter((id) => id !== g._id)
                                : [...prev.gradeIds, g._id],
                            }))
                          }
                        >
                          <Checkbox
                            checked={isSelected}
                            className="h-5 w-5 border-gray-300 data-[state=checked]:border-[#2D9B4E] data-[state=checked]:bg-[#2D9B4E]"
                            onCheckedChange={() => {}} // Handled by div onClick
                          />
                          <span
                            className={cn(
                              'text-sm transition-colors',
                              isSelected ? 'font-bold text-[#2D9B4E]' : 'font-medium text-gray-700',
                            )}
                          >
                            {g.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>

              {newSubject.gradeIds.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {newSubject.gradeIds.map((id) => {
                    const g = grades.find((gr) => gr._id === id);
                    return g ? (
                      <Badge
                        key={id}
                        variant="secondary"
                        className="group h-8 cursor-pointer gap-2 border-none bg-gray-100 px-3 py-0 font-bold text-gray-600 transition-all hover:bg-red-50 hover:text-red-600"
                        onClick={() =>
                          setNewSubject((prev) => ({
                            ...prev,
                            gradeIds: prev.gradeIds.filter((gid) => gid !== id),
                          }))
                        }
                      >
                        {g.name}
                        <PlusCircle className="h-3 w-3 rotate-45 transition-transform group-hover:scale-110" />
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>

            <div
              className={cn(
                'flex cursor-pointer items-center space-x-4 rounded-2xl border p-5 transition-all',
                newSubject.isCompulsory
                  ? 'border-[#2D9B4E] bg-green-50/30'
                  : 'border-gray-100 bg-gray-50/30',
              )}
              onClick={() =>
                setNewSubject({ ...newSubject, isCompulsory: !newSubject.isCompulsory })
              }
            >
              <Checkbox
                checked={newSubject.isCompulsory}
                className="h-6 w-6 border-gray-300 data-[state=checked]:border-[#2D9B4E] data-[state=checked]:bg-[#2D9B4E]"
                onCheckedChange={() => {}} // Handled by div onClick
              />
              <div className="space-y-1">
                <p
                  className={cn(
                    'text-sm font-bold transition-colors',
                    newSubject.isCompulsory ? 'text-[#2D9B4E]' : 'text-gray-900',
                  )}
                >
                  Mark as Compulsory
                </p>
                <p className="text-xs text-gray-500">
                  Every student in the selected grades must take this subject.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="flex items-center justify-between gap-4 border-t border-gray-100 bg-gray-50/50 p-8">
            <Button
              variant="ghost"
              onClick={() => setIsCreateModalOpen(false)}
              className="h-12 rounded-xl border-none font-bold text-gray-500 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              className="h-12 flex-1 rounded-xl bg-[#2D9B4E] px-8 font-bold text-white shadow-lg shadow-green-200 hover:bg-[#217A3C] active:scale-[0.98]"
            >
              Confirm and Save Subject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Deactivate Confirmation */}
      <Dialog
        open={!!subjectToDeactivate}
        onOpenChange={(open) => !open && setSubjectToDeactivate(null)}
      >
        <DialogContent className="max-w-md gap-0 border-none p-0 shadow-2xl">
          <div className="bg-red-50 p-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-100 text-red-600">
              <AlertCircle className="h-8 w-8" />
            </div>
            <div className="mt-6 text-center">
              <DialogTitle className="font-lexend text-2xl font-bold text-gray-900">
                Deactivate Subject?
              </DialogTitle>
              <DialogDescription className="mt-2 text-base text-gray-600">
                Are you sure you want to deactivate{' '}
                <span className="font-bold text-gray-900">
                  &quot;{subjectToDeactivate?.name}&quot;
                </span>
                ?
              </DialogDescription>
            </div>
          </div>

          <div className="font-jakarta p-8 pt-0 text-center">
            <p className="text-sm leading-relaxed text-gray-500">
              This will hide the subject from new timetables and mark sheets. Historical data
              associated with this subject will be preserved.
            </p>
          </div>

          <DialogFooter className="flex flex-col gap-3 p-8 pt-0 sm:flex-row">
            <Button
              variant="ghost"
              className="flex-1 rounded-xl font-bold text-gray-500 hover:bg-gray-100"
              onClick={() => setSubjectToDeactivate(null)}
            >
              No, keep it
            </Button>
            <Button
              variant="destructive"
              className="flex-1 rounded-xl font-bold shadow-lg shadow-red-100 transition-all active:scale-[0.98]"
              onClick={handleDeactivate}
            >
              Yes, deactivate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
