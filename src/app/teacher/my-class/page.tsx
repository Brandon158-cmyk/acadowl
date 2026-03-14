'use client';

import { useQuery } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Users,
  UserCheck,
  BookOpen,
  GraduationCap,
  Calendar,
  AlertTriangle,
  Building,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ── ISSUE-058 · Class Teacher Section Dashboard ──

export default function MyClassPage() {
  const data = useQuery(api.students.classTeacher.getMyClassOverview);

  if (data === undefined) {
    return (
      <div className="mx-auto max-w-6xl animate-pulse space-y-6 pb-10">
        <div className="h-32 rounded-2xl bg-gray-100" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-100" />
          ))}
        </div>
        <div className="h-96 rounded-2xl bg-gray-100" />
      </div>
    );
  }

  if (!data.hasClass) {
    return (
      <div className="mx-auto max-w-3xl pb-10">
        <Card className="flex flex-col items-center gap-4 border-none p-12 text-center shadow-sm ring-1 ring-gray-100">
          <Building className="h-12 w-12 text-gray-300" />
          <h2 className="font-heading text-xl font-semibold text-[#111827]">
            No Class Assigned
          </h2>
          <p className="max-w-md text-sm text-[#6B7280]">
            {data.reason === 'no_staff_profile'
              ? 'Your account does not have a staff profile linked. Please contact your school administrator.'
              : 'You have not been assigned as a class teacher for any section. Contact your school administrator to be assigned a class.'}
          </p>
        </Card>
      </div>
    );
  }

  const section = data.section!;
  const grade = data.grade!;
  const academicYear = data.academicYear;
  const stats = data.stats!;
  const students = data.students!;
  const subjects = data.subjects!;

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      {/* Header */}
      <div>
        <div className="mb-1 flex items-center gap-2 text-sm font-medium text-[#2D9B4E]">
          <span>My Class</span>
          <ChevronRight className="text-muted-foreground/50 h-3.5 w-3.5" />
          <span className="text-muted-foreground font-semibold">{section.displayName}</span>
        </div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-[#111827]">
          {section.displayName}
        </h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          {grade.name} · {academicYear?.label ?? 'No academic year'}
          {section.capacity ? ` · Capacity: ${section.capacity}` : ''}
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total Students"
          value={stats.totalStudents}
          icon={Users}
          bgColor="bg-gray-50"
          iconColor="text-gray-600"
        />
        <StatCard
          label="Male"
          value={stats.maleCount}
          icon={UserCheck}
          bgColor="bg-blue-50"
          iconColor="text-blue-600"
        />
        <StatCard
          label="Female"
          value={stats.femaleCount}
          icon={UserCheck}
          bgColor="bg-pink-50"
          iconColor="text-pink-600"
        />
        <StatCard
          label="Boarding"
          value={stats.boardingCount}
          icon={Building}
          bgColor="bg-amber-50"
          iconColor="text-amber-600"
        />
      </div>

      {/* Student Roster */}
      <Card className="border-none shadow-sm ring-1 ring-gray-100">
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="font-heading text-lg font-semibold text-[#111827]">
            Student Roster
          </h2>
          <span className="text-sm text-gray-500">
            {stats.totalStudents} student{stats.totalStudents !== 1 ? 's' : ''}
          </span>
        </div>

        {students.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <GraduationCap className="h-10 w-10 text-gray-300" />
            <p className="font-semibold text-gray-900">No students enrolled</p>
            <p className="text-sm text-gray-500">
              No active students are currently placed in this section.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px] pl-6">#</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Student No.</TableHead>
                  <TableHead>Gender</TableHead>
                  <TableHead>Boarding</TableHead>
                  <TableHead>Medical Flags</TableHead>
                  <TableHead className="text-right pr-6">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.map((student, idx) => {
                  const hasMedicalFlags =
                    student.medicalConditions ||
                    student.allergies ||
                    student.specialNeeds;

                  return (
                    <TableRow key={student._id} className="group">
                      <TableCell className="pl-6 text-xs text-gray-400">
                        {idx + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2D9B4E]/10 text-xs font-bold text-[#2D9B4E]">
                            {student.firstName[0]}
                            {student.lastName[0]}
                          </div>
                          <div>
                            <span className="text-sm font-medium text-gray-900">
                              {student.lastName}, {student.firstName}
                              {student.preferredName
                                ? ` (${student.preferredName})`
                                : ''}
                            </span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {student.studentNumber}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold',
                            student.gender === 'M'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-pink-50 text-pink-700',
                          )}
                        >
                          {student.gender === 'M' ? 'Male' : 'Female'}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600 capitalize">
                        {student.boardingStatus}
                      </TableCell>
                      <TableCell>
                        {hasMedicalFlags ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                            <AlertTriangle className="h-3 w-3" />
                            Flagged
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right pr-6">
                        <Link href={`/students/${student._id}`}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 gap-1 px-2 text-xs text-gray-500 opacity-0 group-hover:opacity-100"
                          >
                            <ExternalLink className="h-3 w-3" />
                            View
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* Subject Teachers */}
      <Card className="border-none shadow-sm ring-1 ring-gray-100">
        <div className="border-b border-gray-100 px-6 py-4">
          <h2 className="font-heading text-lg font-semibold text-[#111827]">
            Subject Teachers
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            Teachers assigned to teach subjects in this section.
          </p>
        </div>

        {subjects.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <BookOpen className="h-10 w-10 text-gray-300" />
            <p className="font-semibold text-gray-900">No subject assignments</p>
            <p className="text-sm text-gray-500">
              No teachers have been assigned to subjects in this section yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Role</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subjects.map((sub) => (
                  <TableRow key={sub._id}>
                    <TableCell className="font-medium">
                      {sub.subjectName}
                      {sub.subjectCode && (
                        <span className="ml-1.5 text-xs text-gray-400">
                          ({sub.subjectCode})
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'text-sm',
                          sub.isMe ? 'font-semibold text-[#2D9B4E]' : 'text-gray-700',
                        )}
                      >
                        {sub.teacherName}
                        {sub.isMe && ' (You)'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                          sub.isPrimaryTeacher
                            ? 'bg-[#E8F5ED] text-[#2D9B4E]'
                            : 'bg-gray-100 text-gray-600',
                        )}
                      >
                        {sub.isPrimaryTeacher ? 'Primary' : 'Supporting'}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );
}

// ── Stat Card ──

function StatCard({
  label,
  value,
  icon: Icon,
  bgColor,
  iconColor,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  bgColor: string;
  iconColor: string;
}) {
  return (
    <Card className="border-none p-4 shadow-sm ring-1 ring-gray-100">
      <div className="flex items-center gap-3">
        <div className={cn('rounded-lg p-2', bgColor)}>
          <Icon className={cn('h-5 w-5', iconColor)} />
        </div>
        <div>
          <p className="font-heading text-2xl font-bold text-[#111827]">{value}</p>
          <p className="text-xs text-[#6B7280]">{label}</p>
        </div>
      </div>
    </Card>
  );
}
