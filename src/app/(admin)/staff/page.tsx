'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Users,
  Search,
  ChevronRight,
  Phone,
  Mail,
  BookOpen,
  LayoutGrid,
  UserCheck,
  Briefcase,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import Link from 'next/link';

// ── Staff Directory Page ──

type StatusFilter = '' | 'active' | 'on_leave' | 'terminated';
type CategoryFilter = '' | 'teaching' | 'non_teaching' | 'admin';

const STATUS_BADGE: Record<string, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-[#E8F5ED] text-[#2D9B4E]' },
  on_leave: { label: 'On Leave', color: 'bg-[#EFF6FF] text-[#2563EB]' },
  terminated: { label: 'Terminated', color: 'bg-[#FEF2F2] text-[#DC2626]' },
};

const CATEGORY_LABELS: Record<string, string> = {
  teaching: 'Teaching',
  non_teaching: 'Non-Teaching',
  admin: 'Admin',
};

const CONTRACT_LABELS: Record<string, string> = {
  permanent: 'Permanent',
  contract: 'Contract',
  volunteer: 'Volunteer',
  intern: 'Intern',
};

export default function StaffDirectoryPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('');

  const allStaff =
    useQuery(api.staff.queries.getAllStaff, {
      status: statusFilter || undefined,
      category: categoryFilter || undefined,
    }) ?? [];

  // Client-side search filtering
  const filteredStaff = allStaff.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      `${s.firstName} ${s.lastName}`.toLowerCase().includes(q) ||
      s.jobTitle.toLowerCase().includes(q) ||
      (s.email?.toLowerCase().includes(q) ?? false) ||
      (s.phone?.toLowerCase().includes(q) ?? false) ||
      (s.employeeNumber?.toLowerCase().includes(q) ?? false)
    );
  });

  // Summary counts
  const totalActive = allStaff.filter((s) => s.status === 'active').length;
  const totalTeaching = allStaff.filter((s) => s.staffCategory === 'teaching').length;
  const totalOnLeave = allStaff.filter((s) => s.status === 'on_leave').length;

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-10">
      {/* Header */}
      <div className="space-y-1">
        <div className="flex flex-col flex-wrap items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="mb-1 flex items-center gap-2 text-sm font-medium text-[#2D9B4E]">
              <span>Administration</span>
              <ChevronRight className="text-muted-foreground/50 h-3.5 w-3.5" />
              <span className="text-muted-foreground font-semibold">Staff</span>
            </div>
            <h1 className="font-heading text-3xl font-bold tracking-tight text-[#111827]">
              Staff Directory
            </h1>
            <p className="mt-1 max-w-2xl text-sm text-[#6B7280]">
              View and manage all staff members in your school.
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard
          label="Total Staff"
          value={allStaff.length}
          icon={Users}
          bgColor="bg-gray-50"
          iconColor="text-gray-500"
        />
        <SummaryCard
          label="Active"
          value={totalActive}
          icon={UserCheck}
          bgColor="bg-[#E8F5ED]"
          iconColor="text-[#2D9B4E]"
        />
        <SummaryCard
          label="Teaching"
          value={totalTeaching}
          icon={BookOpen}
          bgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <SummaryCard
          label="On Leave"
          value={totalOnLeave}
          icon={Clock}
          bgColor="bg-[#FFFBEB]"
          iconColor="text-[#D97706]"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative max-w-xs flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search name, title, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 rounded-full border-transparent bg-gray-100 pl-10 text-sm focus:border-[#2D9B4E] focus:bg-white"
          />
        </div>
        <Select
          value={statusFilter || 'all'}
          onValueChange={(v) => setStatusFilter(v === 'all' ? '' : (v as StatusFilter) ?? '')}
        >
          <SelectTrigger className="h-10 w-36 text-sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="on_leave">On Leave</SelectItem>
            <SelectItem value="terminated">Terminated</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={categoryFilter || 'all'}
          onValueChange={(v) => setCategoryFilter(v === 'all' ? '' : (v as CategoryFilter) ?? '')}
        >
          <SelectTrigger className="h-10 w-40 text-sm">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="teaching">Teaching</SelectItem>
            <SelectItem value="non_teaching">Non-Teaching</SelectItem>
            <SelectItem value="admin">Admin</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Staff Count */}
      <p className="text-sm text-gray-500">
        Showing <span className="font-semibold text-gray-900">{filteredStaff.length}</span> staff
        member{filteredStaff.length !== 1 ? 's' : ''}
      </p>

      {/* Staff Grid */}
      {filteredStaff.length === 0 ? (
        <Card className="flex flex-col items-center justify-center border-none bg-gray-50 p-12 text-center ring-1 ring-gray-100">
          <Users className="mb-3 h-10 w-10 text-gray-300" />
          <p className="font-semibold text-gray-900">No staff members found</p>
          <p className="mt-1 text-sm text-gray-500">
            {searchQuery || statusFilter || categoryFilter
              ? 'Try adjusting your search or filters.'
              : 'Staff members will appear here once added to your school.'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredStaff.map((staff) => {
            const statusBadge = STATUS_BADGE[staff.status] ?? {
              label: staff.status,
              color: 'bg-gray-100 text-gray-600',
            };

            return (
              <Card
                key={staff._id}
                className="group relative flex flex-col gap-4 overflow-hidden border-none bg-white p-5 shadow-sm ring-1 ring-gray-100 transition-all hover:shadow-md hover:ring-gray-200"
              >
                {/* Header */}
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#2D9B4E]/10 text-sm font-bold text-[#2D9B4E]">
                    {staff.firstName[0]}
                    {staff.lastName[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-heading text-[15px] leading-tight font-semibold text-gray-900">
                      {staff.firstName} {staff.lastName}
                    </h3>
                    <p className="mt-0.5 text-xs text-gray-500">{staff.jobTitle}</p>
                  </div>
                  <span
                    className={cn(
                      'inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                      statusBadge.color,
                    )}
                  >
                    {statusBadge.label}
                  </span>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-3 w-3 text-gray-400" />
                    <span>
                      {CATEGORY_LABELS[staff.staffCategory] ?? staff.staffCategory} ·{' '}
                      {CONTRACT_LABELS[staff.contractType] ?? staff.contractType}
                    </span>
                  </div>
                  {staff.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-gray-400" />
                      <span>{staff.phone}</span>
                    </div>
                  )}
                  {staff.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3 text-gray-400" />
                      <span className="truncate">{staff.email}</span>
                    </div>
                  )}
                </div>

                {/* Footer Stats */}
                <div className="flex items-center gap-3 border-t border-gray-100 pt-3">
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <BookOpen className="h-3 w-3 text-gray-400" />
                    {staff.subjectCount} subject{staff.subjectCount !== 1 ? 's' : ''}
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                    <LayoutGrid className="h-3 w-3 text-gray-400" />
                    {staff.sectionCount} section{staff.sectionCount !== 1 ? 's' : ''}
                  </span>
                  {staff.classSectionName && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                      <UserCheck className="h-3 w-3" />
                      {staff.classSectionName}
                    </span>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Summary Card ──────────────────────────────────────────────

function SummaryCard({
  label,
  value,
  icon: Icon,
  bgColor,
  iconColor,
}: {
  label: string;
  value: number;
  icon: typeof Users;
  bgColor: string;
  iconColor: string;
}) {
  return (
    <Card className="flex items-center gap-3 border-none bg-white p-4 shadow-sm ring-1 ring-gray-100">
      <div
        className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-lg', bgColor)}
      >
        <Icon className={cn('h-4 w-4', iconColor)} />
      </div>
      <div>
        <p className="font-heading text-xl font-bold text-gray-900">{value}</p>
        <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      </div>
    </Card>
  );
}
