'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
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
  PlusCircle,
  Search,
  ChevronLeft,
  Download,
  Users,
  UserCheck,
  ArrowUpDown,
  GraduationCap,
  X,
  SlidersHorizontal,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Id } from '../../../../convex/_generated/dataModel';

// ── Status badge config ─────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-[#E8F5ED]', text: 'text-[#2D9B4E]', label: 'Active' },
  transferred_out: { bg: 'bg-[#EFF6FF]', text: 'text-[#2563EB]', label: 'Transferred' },
  graduated: { bg: 'bg-[#F5F3FF]', text: 'text-[#7C3AED]', label: 'Graduated' },
  withdrawn: { bg: 'bg-[#FEF2F2]', text: 'text-[#DC2626]', label: 'Withdrawn' },
  deceased: { bg: 'bg-[#F3F4F6]', text: 'text-[#6B7280]', label: 'Deceased' },
};

const BOARDING_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  day: { bg: 'bg-[#F3F4F6]', text: 'text-[#374151]', label: 'Day' },
  boarding: { bg: 'bg-[#FFFBEB]', text: 'text-[#D97706]', label: 'Boarding' },
};

// ── Student Avatar ──────────────────────────────────────────────────────────

function StudentAvatar({
  photoUrl,
  firstName,
  lastName,
  size = 'sm',
}: {
  photoUrl?: string;
  firstName: string;
  lastName: string;
  size?: 'sm' | 'md';
}) {
  const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

  return (
    <Avatar size={size === 'sm' ? 'default' : 'lg'}>
      {photoUrl ? (
        <AvatarImage src={photoUrl} alt={`${firstName} ${lastName}`} />
      ) : null}
      <AvatarFallback className="bg-[#2D9B4E]/10 font-semibold text-[#2D9B4E]">
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function StudentsPage() {
  // ── Filters state ──
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('active');
  const [gradeFilter, setGradeFilter] = useState<string>('');
  const [genderFilter, setGenderFilter] = useState<string>('');
  const [boardingFilter, setBoardingFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── Debounced search ──
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(0);
    // Simple debounce with setTimeout
    const timer = setTimeout(() => setDebouncedSearch(value), 300);
    return () => clearTimeout(timer);
  }, []);

  // ── Data fetching ──
  const grades = useQuery(api.academics.grades.getGradesBySchool) ?? [];
  const stats = useQuery(api.students.queries.getStudentStats);

  const studentsData = useQuery(api.students.queries.searchStudents, {
    search: debouncedSearch || undefined,
    status: statusFilter
      ? (statusFilter as 'active' | 'transferred_out' | 'graduated' | 'withdrawn' | 'deceased')
      : undefined,
    gradeId: gradeFilter ? (gradeFilter as Id<'grades'>) : undefined,
    gender: genderFilter ? (genderFilter as 'M' | 'F') : undefined,
    boardingStatus: boardingFilter ? (boardingFilter as 'day' | 'boarding') : undefined,
    limit: 50,
    cursor: page > 0 ? String(page * 50) : undefined,
  });

  const students = studentsData?.students ?? [];
  const totalCount = studentsData?.totalCount ?? 0;
  const hasMore = studentsData?.hasMore ?? false;
  const totalPages = Math.ceil(totalCount / 50);

  // ── Selection ──
  const allOnPageSelected = students.length > 0 && students.every((s) => selectedIds.has(s._id));

  const toggleSelectAll = () => {
    if (allOnPageSelected) {
      const newSet = new Set(selectedIds);
      students.forEach((s) => newSet.delete(s._id));
      setSelectedIds(newSet);
    } else {
      const newSet = new Set(selectedIds);
      students.forEach((s) => newSet.add(s._id));
      setSelectedIds(newSet);
    }
  };

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const clearSelection = () => setSelectedIds(new Set());

  // ── Active filter count ──
  const activeFilterCount = [gradeFilter, genderFilter, boardingFilter].filter(Boolean).length;

  const clearFilters = () => {
    setGradeFilter('');
    setGenderFilter('');
    setBoardingFilter('');
    setPage(0);
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      {/* ── Header ── */}
      <div className="space-y-1">
        <div className="flex flex-col flex-wrap items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <Breadcrumb className="mb-1">
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbLink href="#" className="text-sm font-medium text-[#2D9B4E]">
                    Administration
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbPage className="text-sm font-semibold text-gray-500">
                    Students
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-[#111827]">
              Students
            </h1>
            <p className="mt-1 text-sm text-[#6B7280]">
              Manage student enrolment, profiles, and records.
            </p>
          </div>
          <Link href="/students/enrol">
            <Button className="h-11 bg-[#2D9B4E] px-6 font-semibold shadow-sm hover:bg-[#217A3C]">
              <PlusCircle className="mr-2 h-4 w-4" />
              Enrol Student
            </Button>
          </Link>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      {stats && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="flex flex-col gap-1 border-none p-4 shadow-sm ring-1 ring-gray-100">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#E8F5ED]">
              <Users className="h-4.5 w-4.5 text-[#2D9B4E]" />
            </div>
            <span className="mt-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6B7280]">
              Total Active
            </span>
            <span className="font-heading text-2xl font-bold text-[#111827]">{stats.active}</span>
          </Card>
          <Card className="flex flex-col gap-1 border-none p-4 shadow-sm ring-1 ring-gray-100">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#EFF6FF]">
              <UserCheck className="h-4.5 w-4.5 text-[#2563EB]" />
            </div>
            <span className="mt-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6B7280]">
              Male / Female
            </span>
            <span className="font-heading text-2xl font-bold text-[#111827]">
              {stats.male} / {stats.female}
            </span>
          </Card>
          <Card className="flex flex-col gap-1 border-none p-4 shadow-sm ring-1 ring-gray-100">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#FFFBEB]">
              <GraduationCap className="h-4.5 w-4.5 text-[#D97706]" />
            </div>
            <span className="mt-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6B7280]">
              Boarding / Day
            </span>
            <span className="font-heading text-2xl font-bold text-[#111827]">
              {stats.boarding} / {stats.day}
            </span>
          </Card>
          <Card className="flex flex-col gap-1 border-none p-4 shadow-sm ring-1 ring-gray-100">
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#F5F3FF]">
              <ArrowUpDown className="h-4.5 w-4.5 text-[#7C3AED]" />
            </div>
            <span className="mt-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[#6B7280]">
              Transferred / Graduated
            </span>
            <span className="font-heading text-2xl font-bold text-[#111827]">
              {stats.transferred} / {stats.graduated}
            </span>
          </Card>
        </div>
      )}

      {/* ── Search & Filters Bar ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          {/* Search */}
          <div className="relative max-w-sm flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
            <Input
              placeholder="Search by name or student number..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="h-10 rounded-full border-transparent bg-[#F3F4F6] pl-10 text-sm focus:border-[#2D9B4E] focus:bg-white focus:ring-[#2D9B4E]/15"
            />
            {search && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSearch('');
                  setDebouncedSearch('');
                  setPage(0);
                }}
                className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>

          {/* Status filter */}
          <Select
            value={statusFilter}
            onValueChange={(val) => {
              if (val) { setStatusFilter(val === 'all' ? '' : val); setPage(0); }
            }}
          >
            <SelectTrigger className="h-10 w-[140px] rounded-lg border-gray-200 text-sm">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="transferred_out">Transferred</SelectItem>
              <SelectItem value="graduated">Graduated</SelectItem>
              <SelectItem value="withdrawn">Withdrawn</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              'h-10 gap-2 rounded-lg border-gray-200 px-3 text-sm',
              showFilters && 'border-[#2D9B4E] bg-[#E8F5ED] text-[#2D9B4E]',
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#2D9B4E] text-[10px] font-bold text-white">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {/* Result count */}
        <span className="text-sm text-[#6B7280]">
          {totalCount} student{totalCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* ── Expanded Filters Panel ── */}
      {showFilters && (
        <Card className="flex flex-wrap items-end gap-4 border-none p-4 shadow-sm ring-1 ring-gray-100">
          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-medium text-[#374151]">Grade</Label>
            <Select value={gradeFilter} onValueChange={(val) => { if (val) { setGradeFilter(val === 'all' ? '' : val); setPage(0); } }}>
              <SelectTrigger className="h-10 w-[180px] rounded-lg border-gray-200 text-sm">
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

          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-medium text-[#374151]">Gender</Label>
            <Select value={genderFilter} onValueChange={(val) => { if (val) { setGenderFilter(val === 'all' ? '' : val); setPage(0); } }}>
              <SelectTrigger className="h-10 w-[140px] rounded-lg border-gray-200 text-sm">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="M">Male</SelectItem>
                <SelectItem value="F">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label className="text-[13px] font-medium text-[#374151]">Boarding</Label>
            <Select value={boardingFilter} onValueChange={(val) => { if (val) { setBoardingFilter(val === 'all' ? '' : val); setPage(0); } }}>
              <SelectTrigger className="h-10 w-[140px] rounded-lg border-gray-200 text-sm">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="boarding">Boarding</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-10 text-sm text-[#DC2626] hover:bg-red-50 hover:text-[#B91C1C]"
            >
              Clear Filters
            </Button>
          )}
        </Card>
      )}

      {/* ── Bulk Actions Bar ── */}
      {selectedIds.size > 0 && (
        <Card className="flex items-center justify-between border-none bg-[#2D9B4E] p-3 text-white shadow-sm">
          <span className="text-sm font-medium">
            {selectedIds.size} student{selectedIds.size !== 1 ? 's' : ''} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-xs text-white hover:bg-white/20 hover:text-white"
            >
              <Download className="mr-1.5 h-3.5 w-3.5" />
              Export CSV
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearSelection}
              className="h-8 text-xs text-white/80 hover:bg-white/20 hover:text-white"
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Clear
            </Button>
          </div>
        </Card>
      )}

      {/* ── Student Table ── */}
      <Card className="overflow-hidden border-none shadow-sm ring-1 ring-gray-100">
        <Table>
          <TableHeader>
            <TableRow className="border-b-2 border-[#E5E7EB] bg-[#F9FAFB] hover:bg-[#F9FAFB]">
              <TableHead className="w-10 px-4 py-3">
                <Checkbox
                  checked={allOnPageSelected && students.length > 0}
                  onCheckedChange={toggleSelectAll}
                />
              </TableHead>
              <TableHead className="px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#6B7280]">
                Student
              </TableHead>
              <TableHead className="px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#6B7280]">
                Student No.
              </TableHead>
              <TableHead className="hidden px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#6B7280] md:table-cell">
                Grade / Section
              </TableHead>
              <TableHead className="hidden px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#6B7280] lg:table-cell">
                Status
              </TableHead>
              <TableHead className="hidden px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#6B7280] lg:table-cell">
                Boarding
              </TableHead>
              <TableHead className="hidden px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.05em] text-[#6B7280] xl:table-cell">
                Guardian Phone
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={7} className="py-16 text-center">
                  <div className="flex flex-col items-center gap-2">
                    <GraduationCap className="h-10 w-10 text-gray-200" />
                    <p className="text-sm font-medium text-[#6B7280]">
                      {debouncedSearch || activeFilterCount > 0
                        ? 'No students match your search'
                        : 'No students enrolled yet'}
                    </p>
                    {!debouncedSearch && activeFilterCount === 0 && (
                      <Link href="/students/enrol">
                        <Button
                          size="sm"
                          className="mt-2 bg-[#2D9B4E] font-semibold hover:bg-[#217A3C]"
                        >
                          <PlusCircle className="mr-1.5 h-3.5 w-3.5" />
                          Enrol First Student
                        </Button>
                      </Link>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            )}
            {students.map((student) => {
              const statusStyle = STATUS_STYLES[student.status] ?? STATUS_STYLES.active;
              const boardingStyle =
                BOARDING_STYLES[student.boardingStatus] ?? BOARDING_STYLES.day;

              return (
                <TableRow
                  key={student._id}
                  className={cn(
                    'border-b border-[#F3F4F6]',
                    selectedIds.has(student._id) && 'border-l-[3px] border-l-[#2D9B4E] bg-[#E8F5ED]',
                  )}
                >
                  <TableCell className="w-10 px-4 py-3">
                    <Checkbox
                      checked={selectedIds.has(student._id)}
                      onCheckedChange={() => toggleSelect(student._id)}
                    />
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <Link
                      href={`/students/${student._id}`}
                      className="flex items-center gap-3"
                    >
                      <StudentAvatar
                        photoUrl={student.photoUrl}
                        firstName={student.firstName}
                        lastName={student.lastName}
                      />
                      <div className="min-w-0">
                        <p className="truncate text-[14px] font-medium text-[#111827]">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="truncate text-[12px] text-[#9CA3AF] md:hidden">
                          {student.gradeName} · {student.sectionName}
                        </p>
                      </div>
                    </Link>
                  </TableCell>
                  <TableCell className="px-4 py-3">
                    <span className="font-mono text-[13px] text-[#6B7280]">
                      {student.studentNumber}
                    </span>
                  </TableCell>
                  <TableCell className="hidden px-4 py-3 md:table-cell">
                    <span className="text-[14px] text-[#374151]">
                      {student.sectionName}
                    </span>
                  </TableCell>
                  <TableCell className="hidden px-4 py-3 lg:table-cell">
                    <Badge
                      variant="secondary"
                      className={cn(
                        'rounded-full text-[12px] font-semibold',
                        statusStyle.bg,
                        statusStyle.text,
                      )}
                    >
                      {statusStyle.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden px-4 py-3 lg:table-cell">
                    <Badge
                      variant="secondary"
                      className={cn(
                        'rounded-full text-[12px] font-semibold',
                        boardingStyle.bg,
                        boardingStyle.text,
                      )}
                    >
                      {boardingStyle.label}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden px-4 py-3 xl:table-cell">
                    <span className="font-mono text-[13px] text-[#6B7280]">
                      {student.guardianPhone ?? '—'}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* ── Pagination Footer ── */}
        {totalCount > 0 && (
          <div className="flex items-center justify-between border-t border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3">
            <span className="text-[13px] text-[#6B7280]">
              Showing {page * 50 + 1}–{Math.min((page + 1) * 50, totalCount)} of {totalCount}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page === 0}
                onClick={() => setPage(Math.max(0, page - 1))}
                className="h-8 gap-1 rounded-lg border-gray-200 px-3 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
                Previous
              </Button>
              <span className="text-[13px] font-medium text-[#374151]">
                Page {page + 1} of {totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={!hasMore}
                onClick={() => setPage(page + 1)}
                className="h-8 gap-1 rounded-lg border-gray-200 px-3 text-xs"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
