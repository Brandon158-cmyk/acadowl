'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { Id } from '../../../../../convex/_generated/dataModel';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PlusCircle,
  Search,
  Clock,
  FileText,
  Lock,
  Globe,
  ChevronRight,
  ChevronLeft,
  Filter,
  CheckCircle2,
  BookOpen,
  LayoutGrid,
  MoreVertical,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';

export default function LessonPlansPage() {
  const subjectsRaw = useQuery(api.academics.subjects.getSubjectsBySchool);
  const gradesRaw = useQuery(api.academics.grades.getGradesBySchool);
  const myPlansRaw = useQuery(api.academics.lessonPlans.getPlansByStaff);

  const isLoading = subjectsRaw === undefined || gradesRaw === undefined || myPlansRaw === undefined;
  const subjects = subjectsRaw ?? [];
  const grades = gradesRaw ?? [];
  const myPlans = myPlansRaw ?? [];

  const deletePlanMutation = useMutation(api.academics.lessonPlans.deletePlan);
  const duplicatePlanMutation = useMutation(api.academics.lessonPlans.duplicatePlan);

  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredPlans = myPlans.filter((plan) => {
    const matchesSearch =
      plan.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      plan.syllabusTopicRef?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSubject = selectedSubject === 'all' || plan.subjectId === selectedSubject;
    const matchesGrade = selectedGrade === 'all' || plan.gradeId === selectedGrade;
    const matchesStatus = statusFilter === 'all' || plan.status === statusFilter;

    return matchesSearch && matchesSubject && matchesGrade && matchesStatus;
  });

  const totalPages = Math.max(1, Math.ceil(filteredPlans.length / itemsPerPage));
  const clampedPage = Math.min(currentPage, totalPages);
  if (clampedPage !== currentPage) setCurrentPage(clampedPage);
  const paginatedPlans = filteredPlans.slice(
    (clampedPage - 1) * itemsPerPage,
    clampedPage * itemsPerPage,
  );

  const stats = {
    total: myPlans.length,
    published: myPlans.filter((p) => p.status === 'published').length,
    drafts: myPlans.filter((p) => p.status === 'draft').length,
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-1 flex items-center gap-2 text-sm font-medium text-[#2D9B4E]">
            <span>Academics</span>
            <ChevronRight className="text-muted-foreground/50 h-3.5 w-3.5" />
            <span className="text-muted-foreground font-semibold">Lesson Repository</span>
          </div>
          <h1 className="font-heading text-3xl font-bold tracking-tight text-[#111827]">
            Lesson Plans
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-[#6B7280]">
            Create, manage and distribute your curriculum resources across your classes.
          </p>
        </div>
        <Button
          onClick={() => router.push('/academics/lesson-plans/create')}
          className="h-11 bg-[#2D9B4E] px-6 font-semibold shadow-lg shadow-green-900/10 transition-all hover:bg-[#217A3C] active:scale-95"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Create New Plan
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="relative overflow-hidden border-none bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <BookOpen className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Plans</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.total}</h3>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden border-none bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-green-50 text-[#2D9B4E]">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Published</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.published}</h3>
            </div>
          </div>
        </Card>

        <Card className="relative overflow-hidden border-none bg-white p-6 shadow-sm ring-1 ring-gray-100">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Drafts</p>
              <h3 className="text-2xl font-bold text-gray-900">{stats.drafts}</h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Action Bar */}
      <div className="flex flex-col items-start justify-between gap-4 lg:flex-row lg:items-center">
        <div className="relative w-full max-w-sm">
          <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search by title or topic..."
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
            value={statusFilter}
            onValueChange={(val) => {
              if (val) {
                setStatusFilter(val as 'all' | 'draft' | 'published');
                setCurrentPage(1);
              }
            }}
          >
            <SelectTrigger className="h-11 w-[140px] rounded-xl border-gray-200 bg-white shadow-none">
              <Filter className="mr-2 h-4 w-4 text-gray-400" />
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="draft">Drafts</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={selectedSubject}
            onValueChange={(val) => {
              if (val) {
                setSelectedSubject(val);
                setCurrentPage(1);
              }
            }}
          >
            <SelectTrigger className="h-11 w-full border-gray-100 bg-white sm:w-[180px]">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map((sub) => (
                <SelectItem key={sub._id} value={sub._id}>
                  {sub.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={selectedGrade}
            onValueChange={(val) => {
              if (val) {
                setSelectedGrade(val);
                setCurrentPage(1);
              }
            }}
          >
            <SelectTrigger className="h-11 w-full border-gray-100 bg-white sm:w-[150px]">
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
        </div>
      </div>

      {/* Content Table */}
      <div className="overflow-hidden rounded-2xl border-none bg-white shadow-sm ring-1 ring-gray-100">
        <Table>
          <TableHeader className="bg-gray-50/50">
            <TableRow className="hover:bg-transparent">
              <TableHead className="py-4 font-bold text-gray-900">Lesson Identification</TableHead>
              <TableHead className="py-4 font-bold text-gray-900">Subject & Grade</TableHead>
              <TableHead className="py-4 font-bold text-gray-900">Reference</TableHead>
              <TableHead className="py-4 font-bold text-gray-900">Availability</TableHead>
              <TableHead className="py-4 text-right font-bold text-gray-900">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedPlans.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center opacity-40">
                    <div className="mb-4 rounded-full bg-gray-100 p-4">
                      <LayoutGrid className="h-10 w-10 text-gray-400" />
                    </div>
                    <p className="text-lg font-medium text-gray-900">No lesson plans found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedPlans.map((plan) => {
                const subject = subjects.find((s) => s._id === plan.subjectId);
                const grade = grades.find((g) => g._id === plan.gradeId);

                return (
                  <TableRow
                    key={plan._id}
                    className="group cursor-pointer transition-colors hover:bg-gray-50/50"
                    onClick={() => router.push(`/academics/lesson-plans/${plan._id}`)}
                  >
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-xl',
                            plan.status === 'published'
                              ? 'bg-green-50 text-[#2D9B4E]'
                              : 'bg-gray-50 text-gray-400',
                          )}
                        >
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-jakarta font-semibold text-gray-900">
                            {plan.title || (
                              <span className="text-gray-400 italic">Untitled Draft</span>
                            )}
                          </p>
                          <div className="mt-0.5 flex items-center gap-2">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs font-medium text-gray-500">
                              {plan.duration ? `${plan.duration} mins` : 'Duration not set'}
                            </span>
                            <span className="text-gray-300">•</span>
                            <span className="text-xs font-medium text-gray-500">
                              {plan.resources.length} resources
                            </span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-sm">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-gray-900">{subject?.name}</span>
                        <Badge
                          variant="secondary"
                          className="w-fit bg-gray-100 font-bold text-gray-600 hover:bg-gray-200"
                        >
                          {grade?.name}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      {plan.syllabusTopicRef ? (
                        <div className="inline-flex flex-col">
                          <span className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                            Topic Ref
                          </span>
                          <span className="text-sm font-semibold text-gray-600">
                            {plan.syllabusTopicRef}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      {plan.status === 'draft' ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700">
                          <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                          Draft
                        </span>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-bold text-[#2D9B4E]">
                            <div className="h-1.5 w-1.5 rounded-full bg-[#2D9B4E]" />
                            Published
                          </span>
                          {plan.visibility === 'school' ? (
                            <span title="Visible to school">
                              <Globe className="h-4 w-4 text-emerald-500" />
                            </span>
                          ) : (
                            <span title="Private">
                              <Lock className="h-4 w-4 text-gray-400" />
                            </span>
                          )}
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-gray-400 hover:bg-gray-100 hover:text-gray-900"
                          onClick={() => router.push(`/academics/lesson-plans/${plan._id}`)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-900"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-xl">
                            <DropdownMenuItem
                              className="flex items-center gap-2 py-2"
                              onSelect={async () => {
                                try {
                                  await duplicatePlanMutation({ id: plan._id as Id<'lessonPlans'> });
                                  toast.success('Lesson plan duplicated.');
                                } catch (e) {
                                  toast.error((e as Error).message || 'Failed to duplicate plan.');
                                }
                              }}
                            >
                              <FileText className="h-4 w-4" /> Duplicate
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="flex items-center gap-2 py-2 text-red-600 focus:bg-red-50 focus:text-red-700"
                              onSelect={async () => {
                                if (!confirm('Are you sure you want to delete this lesson plan?')) return;
                                try {
                                  await deletePlanMutation({ id: plan._id as Id<'lessonPlans'> });
                                  toast.success('Lesson plan deleted.');
                                } catch (e) {
                                  toast.error((e as Error).message || 'Failed to delete plan.');
                                }
                              }}
                            >
                              <Trash2 className="h-4 w-4" /> Delete Plan
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Footer */}
      {filteredPlans.length > 0 && (
        <div className="flex flex-col items-center justify-between gap-4 px-2 sm:flex-row">
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <p>
              Showing{' '}
              <span className="font-semibold text-gray-900">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-gray-900">
                {Math.min(currentPage * itemsPerPage, filteredPlans.length)}
              </span>{' '}
              of <span className="font-semibold text-gray-900">{filteredPlans.length}</span> plans
            </p>

            <div className="flex items-center gap-2">
              <span className="shrink-0">Rows per page:</span>
              <Select
                value={String(itemsPerPage)}
                onValueChange={(v) => {
                  if (v) {
                    setItemsPerPage(Number(v));
                    setCurrentPage(1);
                  }
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
              {(() => {
                const startPage = totalPages <= 5
                  ? 1
                  : Math.max(1, Math.min(currentPage - 2, totalPages - 4));
                return Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                const pageNum = startPage + i;
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
              });
              })()}
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
  );
}
