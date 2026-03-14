'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  ChevronRight,
  Phone,
  Mail,
  Calendar,
  Edit2,
  Save,
  X,
  Loader2,
  BookOpen,
  LayoutGrid,
  UserCheck,
  Briefcase,
  MapPin,
  Shield,
  CreditCard,
  AlertTriangle,
  Clock,
  FileText,
  Users,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Id } from '../../../../../convex/_generated/dataModel';

// ── Status badge config ──

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-[#E8F5ED]', text: 'text-[#2D9B4E]', label: 'Active' },
  on_leave: { bg: 'bg-[#EFF6FF]', text: 'text-[#2563EB]', label: 'On Leave' },
  terminated: { bg: 'bg-[#FEF2F2]', text: 'text-[#DC2626]', label: 'Terminated' },
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

// ── Main Page ──

export default function StaffProfilePage() {
  const params = useParams();
  const staffId = params.id as Id<'staff'>;

  const staff = useQuery(api.staff.queries.getStaffById, { staffId });
  const assignments = useQuery(api.staff.assignments.getAssignmentsForStaff, { staffId });
  const leaveRequests = useQuery(api.staff.leaveRequests.getLeaveRequestsForStaff, { staffId });

  const updateStaff = useMutation(api.staff.mutations.updateStaff);
  const terminateStaff = useMutation(api.staff.mutations.terminateStaff);
  const reactivateStaff = useMutation(api.staff.mutations.reactivateStaff);

  // ── Edit state ──
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  if (staff === undefined) {
    return (
      <div className="mx-auto max-w-5xl animate-pulse space-y-6 pb-10">
        <div className="h-48 rounded-2xl bg-gray-100" />
        <div className="h-96 rounded-2xl bg-gray-100" />
      </div>
    );
  }

  if (staff === null) {
    return (
      <div className="mx-auto max-w-5xl pb-10">
        <Card className="flex flex-col items-center gap-4 border-none p-12 text-center shadow-sm ring-1 ring-gray-100">
          <AlertTriangle className="h-12 w-12 text-amber-400" />
          <h2 className="font-heading text-xl font-semibold text-[#111827]">
            Staff Member Not Found
          </h2>
          <p className="text-sm text-[#6B7280]">
            The staff member you are looking for does not exist or you do not have access.
          </p>
          <Link href="/staff">
            <Button className="mt-2 bg-[#2D9B4E] font-semibold hover:bg-[#217A3C]">
              Back to Staff Directory
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const statusStyle = STATUS_STYLES[staff.status] ?? STATUS_STYLES.active;

  // ── Edit handlers ──
  const startEdit = () => {
    setEditData({
      firstName: staff.firstName,
      lastName: staff.lastName,
      middleName: staff.middleName ?? '',
      gender: staff.gender,
      dateOfBirth: staff.dateOfBirth ?? '',
      nrc: staff.nrc ?? '',
      phone: staff.phone,
      altPhone: staff.altPhone ?? '',
      email: staff.email ?? '',
      address: staff.address ?? '',
      emergencyContactName: staff.emergencyContact?.name ?? '',
      emergencyContactPhone: staff.emergencyContact?.phone ?? '',
      emergencyContactRelation: staff.emergencyContact?.relation ?? '',
      staffCategory: staff.staffCategory,
      jobTitle: staff.jobTitle,
      tcazNumber: staff.tcazNumber ?? '',
      employeeNumber: staff.employeeNumber ?? '',
      contractType: staff.contractType,
      dateJoined: staff.dateJoined,
      bankName: staff.bankName ?? '',
      bankAccountNumber: staff.bankAccountNumber ?? '',
      napsaNumber: staff.napsaNumber ?? '',
      nhimaNumber: staff.nhimaNumber ?? '',
    });
    setIsEditing(true);
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setEditData({});
  };

  const saveEdit = async () => {
    setIsSaving(true);
    try {
      const emergencyContact =
        editData.emergencyContactName && editData.emergencyContactPhone
          ? {
              name: editData.emergencyContactName.trim(),
              phone: editData.emergencyContactPhone.trim(),
              relation: editData.emergencyContactRelation?.trim() || 'Other',
            }
          : undefined;

      // For optional fields: undefined = not edited, empty string = explicitly cleared
      const trimOrUndefined = (val: string | undefined) =>
        val === undefined ? undefined : val.trim();

      await updateStaff({
        staffId,
        firstName: trimOrUndefined(editData.firstName) || undefined,
        lastName: trimOrUndefined(editData.lastName) || undefined,
        middleName: trimOrUndefined(editData.middleName),
        gender: editData.gender || undefined,
        dateOfBirth: editData.dateOfBirth || undefined,
        nrc: trimOrUndefined(editData.nrc),
        phone: trimOrUndefined(editData.phone),
        altPhone: trimOrUndefined(editData.altPhone),
        email: trimOrUndefined(editData.email),
        address: trimOrUndefined(editData.address),
        emergencyContact,
        staffCategory: editData.staffCategory || undefined,
        jobTitle: trimOrUndefined(editData.jobTitle),
        tcazNumber: trimOrUndefined(editData.tcazNumber),
        employeeNumber: trimOrUndefined(editData.employeeNumber),
        contractType: editData.contractType || undefined,
        dateJoined: editData.dateJoined || undefined,
        bankName: trimOrUndefined(editData.bankName),
        bankAccountNumber: trimOrUndefined(editData.bankAccountNumber),
        napsaNumber: trimOrUndefined(editData.napsaNumber),
        nhimaNumber: trimOrUndefined(editData.nhimaNumber),
      });
      toast.success('Staff profile updated');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.data ?? 'Failed to update staff profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleTerminate = async () => {
    if (!confirm('Are you sure you want to terminate this staff member? Their user account will also be deactivated.')) return;
    try {
      await terminateStaff({ staffId });
      toast.success('Staff member terminated');
    } catch (error: any) {
      toast.error(error.data ?? 'Failed to terminate staff member');
    }
  };

  const handleReactivate = async () => {
    try {
      await reactivateStaff({ staffId });
      toast.success('Staff member reactivated');
    } catch (error: any) {
      toast.error(error.data ?? 'Failed to reactivate staff member');
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm font-medium text-[#2D9B4E]">
        <Link href="/staff" className="hover:underline">
          Staff
        </Link>
        <ChevronRight className="text-muted-foreground/50 h-3.5 w-3.5" />
        <span className="text-muted-foreground font-semibold">
          {staff.firstName} {staff.lastName}
        </span>
      </div>

      {/* Profile Header */}
      <Card className="overflow-hidden border-none shadow-sm ring-1 ring-gray-100">
        <div className="h-2 bg-gradient-to-r from-[#2D9B4E] to-[#2D9B4E]/60" />
        <div className="flex flex-col gap-6 p-6 sm:flex-row sm:items-start">
          {/* Avatar */}
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-[#2D9B4E]/10 text-2xl font-bold text-[#2D9B4E]">
            {staff.firstName[0]}
            {staff.lastName[0]}
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start gap-3">
              <div>
                <h1 className="font-heading text-2xl font-bold text-[#111827]">
                  {staff.firstName} {staff.middleName ? `${staff.middleName} ` : ''}
                  {staff.lastName}
                </h1>
                <p className="mt-0.5 text-sm text-[#6B7280]">{staff.jobTitle}</p>
              </div>
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide',
                  statusStyle.bg,
                  statusStyle.text,
                )}
              >
                {statusStyle.label}
              </span>
            </div>

            {/* Quick Info */}
            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[#6B7280]">
              {staff.phone && (
                <span className="flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5 text-gray-400" />
                  {staff.phone}
                </span>
              )}
              {staff.email && (
                <span className="flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5 text-gray-400" />
                  {staff.email}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-gray-400" />
                {CATEGORY_LABELS[staff.staffCategory]} · {CONTRACT_LABELS[staff.contractType]}
              </span>
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-gray-400" />
                Joined {staff.dateJoined}
              </span>
              {staff.employeeNumber && (
                <span className="flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-gray-400" />
                  #{staff.employeeNumber}
                </span>
              )}
            </div>

            {/* Subject & Section Tags */}
            {staff.subjects && staff.subjects.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {staff.subjects.map((s: any) => (
                  <span
                    key={s._id}
                    className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700"
                  >
                    <BookOpen className="h-3 w-3" />
                    {s.name}
                  </span>
                ))}
                {staff.classSectionName && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-medium text-green-700">
                    <UserCheck className="h-3 w-3" />
                    Class Teacher: {staff.classSectionName}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex shrink-0 gap-2">
            {!isEditing ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 text-sm"
                  onClick={startEdit}
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit
                </Button>
                {staff.status === 'terminated' ? (
                  <Button
                    size="sm"
                    className="h-9 gap-1.5 bg-[#2D9B4E] text-sm font-semibold hover:bg-[#217A3C]"
                    onClick={handleReactivate}
                  >
                    Reactivate
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 gap-1.5 border-red-200 text-sm text-red-600 hover:bg-red-50"
                    onClick={handleTerminate}
                  >
                    Terminate
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 gap-1.5 text-sm"
                  onClick={cancelEdit}
                  disabled={isSaving}
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="h-9 gap-1.5 bg-[#2D9B4E] text-sm font-semibold hover:bg-[#217A3C]"
                  onClick={saveEdit}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  Save
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="h-auto rounded-xl bg-gray-100/80 p-1">
          <TabsTrigger value="personal" className="rounded-lg px-4 py-2 text-sm">
            Personal
          </TabsTrigger>
          <TabsTrigger value="professional" className="rounded-lg px-4 py-2 text-sm">
            Professional
          </TabsTrigger>
          <TabsTrigger value="assignments" className="rounded-lg px-4 py-2 text-sm">
            Assignments
          </TabsTrigger>
          <TabsTrigger value="leave" className="rounded-lg px-4 py-2 text-sm">
            Leave
          </TabsTrigger>
          <TabsTrigger value="payroll" className="rounded-lg px-4 py-2 text-sm">
            Payroll
          </TabsTrigger>
        </TabsList>

        {/* ── Personal Tab ── */}
        <TabsContent value="personal">
          <Card className="border-none p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="font-heading mb-6 text-lg font-semibold text-[#111827]">
              Personal Information
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <FieldRow label="First Name" icon={<Users className="h-4 w-4" />}>
                {isEditing ? (
                  <Input
                    value={editData.firstName ?? ''}
                    onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                    className="h-9"
                  />
                ) : (
                  <span>{staff.firstName}</span>
                )}
              </FieldRow>
              <FieldRow label="Last Name" icon={<Users className="h-4 w-4" />}>
                {isEditing ? (
                  <Input
                    value={editData.lastName ?? ''}
                    onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                    className="h-9"
                  />
                ) : (
                  <span>{staff.lastName}</span>
                )}
              </FieldRow>
              <FieldRow label="Middle Name" icon={<Users className="h-4 w-4" />}>
                {isEditing ? (
                  <Input
                    value={editData.middleName ?? ''}
                    onChange={(e) => setEditData({ ...editData, middleName: e.target.value })}
                    className="h-9"
                  />
                ) : (
                  <span className="text-gray-400">{staff.middleName || '—'}</span>
                )}
              </FieldRow>
              <FieldRow label="Gender" icon={<Users className="h-4 w-4" />}>
                {isEditing ? (
                  <Select
                    value={editData.gender ?? ''}
                    onValueChange={(v) => setEditData({ ...editData, gender: v })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="M">Male</SelectItem>
                      <SelectItem value="F">Female</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span>{staff.gender === 'M' ? 'Male' : 'Female'}</span>
                )}
              </FieldRow>
              <FieldRow label="Date of Birth" icon={<Calendar className="h-4 w-4" />}>
                {isEditing ? (
                  <Input
                    type="date"
                    value={editData.dateOfBirth ?? ''}
                    onChange={(e) => setEditData({ ...editData, dateOfBirth: e.target.value })}
                    className="h-9"
                  />
                ) : (
                  <span className="text-gray-400">{staff.dateOfBirth || '—'}</span>
                )}
              </FieldRow>
              <FieldRow label="NRC Number" icon={<CreditCard className="h-4 w-4" />}>
                {isEditing ? (
                  <Input
                    value={editData.nrc ?? ''}
                    onChange={(e) => setEditData({ ...editData, nrc: e.target.value })}
                    className="h-9"
                    placeholder="e.g. 123456/78/9"
                  />
                ) : (
                  <span className="text-gray-400">{staff.nrc || '—'}</span>
                )}
              </FieldRow>
              <FieldRow label="Phone" icon={<Phone className="h-4 w-4" />}>
                {isEditing ? (
                  <Input
                    value={editData.phone ?? ''}
                    onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                    className="h-9"
                  />
                ) : (
                  <span>{staff.phone}</span>
                )}
              </FieldRow>
              <FieldRow label="Alt Phone" icon={<Phone className="h-4 w-4" />}>
                {isEditing ? (
                  <Input
                    value={editData.altPhone ?? ''}
                    onChange={(e) => setEditData({ ...editData, altPhone: e.target.value })}
                    className="h-9"
                  />
                ) : (
                  <span className="text-gray-400">{staff.altPhone || '—'}</span>
                )}
              </FieldRow>
              <FieldRow label="Email" icon={<Mail className="h-4 w-4" />}>
                {isEditing ? (
                  <Input
                    type="email"
                    value={editData.email ?? ''}
                    onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                    className="h-9"
                  />
                ) : (
                  <span className="text-gray-400">{staff.email || '—'}</span>
                )}
              </FieldRow>
              <FieldRow label="Address" icon={<MapPin className="h-4 w-4" />}>
                {isEditing ? (
                  <Input
                    value={editData.address ?? ''}
                    onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                    className="h-9"
                  />
                ) : (
                  <span className="text-gray-400">{staff.address || '—'}</span>
                )}
              </FieldRow>
            </div>

            {/* Emergency Contact */}
            <h3 className="font-heading mt-8 mb-4 text-base font-semibold text-[#111827]">
              Emergency Contact
            </h3>
            <div className="grid gap-6 sm:grid-cols-3">
              <FieldRow label="Name" icon={<Shield className="h-4 w-4" />}>
                {isEditing ? (
                  <Input
                    value={editData.emergencyContactName ?? ''}
                    onChange={(e) =>
                      setEditData({ ...editData, emergencyContactName: e.target.value })
                    }
                    className="h-9"
                  />
                ) : (
                  <span className="text-gray-400">
                    {staff.emergencyContact?.name || '—'}
                  </span>
                )}
              </FieldRow>
              <FieldRow label="Phone" icon={<Phone className="h-4 w-4" />}>
                {isEditing ? (
                  <Input
                    value={editData.emergencyContactPhone ?? ''}
                    onChange={(e) =>
                      setEditData({ ...editData, emergencyContactPhone: e.target.value })
                    }
                    className="h-9"
                  />
                ) : (
                  <span className="text-gray-400">
                    {staff.emergencyContact?.phone || '—'}
                  </span>
                )}
              </FieldRow>
              <FieldRow label="Relation" icon={<Users className="h-4 w-4" />}>
                {isEditing ? (
                  <Input
                    value={editData.emergencyContactRelation ?? ''}
                    onChange={(e) =>
                      setEditData({ ...editData, emergencyContactRelation: e.target.value })
                    }
                    className="h-9"
                  />
                ) : (
                  <span className="text-gray-400">
                    {staff.emergencyContact?.relation || '—'}
                  </span>
                )}
              </FieldRow>
            </div>
          </Card>
        </TabsContent>

        {/* ── Professional Tab ── */}
        <TabsContent value="professional">
          <Card className="border-none p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="font-heading mb-6 text-lg font-semibold text-[#111827]">
              Professional Details
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <FieldRow label="Staff Category" icon={<Briefcase className="h-4 w-4" />}>
                {isEditing ? (
                  <Select
                    value={editData.staffCategory ?? ''}
                    onValueChange={(v) => setEditData({ ...editData, staffCategory: v })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teaching">Teaching</SelectItem>
                      <SelectItem value="non_teaching">Non-Teaching</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span>{CATEGORY_LABELS[staff.staffCategory]}</span>
                )}
              </FieldRow>
              <FieldRow label="Job Title" icon={<Briefcase className="h-4 w-4" />}>
                {isEditing ? (
                  <Input
                    value={editData.jobTitle ?? ''}
                    onChange={(e) => setEditData({ ...editData, jobTitle: e.target.value })}
                    className="h-9"
                  />
                ) : (
                  <span>{staff.jobTitle}</span>
                )}
              </FieldRow>
              <FieldRow label="Contract Type" icon={<FileText className="h-4 w-4" />}>
                {isEditing ? (
                  <Select
                    value={editData.contractType ?? ''}
                    onValueChange={(v) => setEditData({ ...editData, contractType: v })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="permanent">Permanent</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="volunteer">Volunteer</SelectItem>
                      <SelectItem value="intern">Intern</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span>{CONTRACT_LABELS[staff.contractType]}</span>
                )}
              </FieldRow>
              <FieldRow label="Date Joined" icon={<Calendar className="h-4 w-4" />}>
                {isEditing ? (
                  <Input
                    type="date"
                    value={editData.dateJoined ?? ''}
                    onChange={(e) => setEditData({ ...editData, dateJoined: e.target.value })}
                    className="h-9"
                  />
                ) : (
                  <span>{staff.dateJoined}</span>
                )}
              </FieldRow>
              <FieldRow label="TCAZ Number" icon={<Shield className="h-4 w-4" />}>
                {isEditing ? (
                  <Input
                    value={editData.tcazNumber ?? ''}
                    onChange={(e) => setEditData({ ...editData, tcazNumber: e.target.value })}
                    className="h-9"
                    placeholder="Teaching Council of Zambia"
                  />
                ) : (
                  <span className="text-gray-400">{staff.tcazNumber || '—'}</span>
                )}
              </FieldRow>
              <FieldRow label="Employee Number" icon={<FileText className="h-4 w-4" />}>
                {isEditing ? (
                  <Input
                    value={editData.employeeNumber ?? ''}
                    onChange={(e) =>
                      setEditData({ ...editData, employeeNumber: e.target.value })
                    }
                    className="h-9"
                  />
                ) : (
                  <span className="text-gray-400">{staff.employeeNumber || '—'}</span>
                )}
              </FieldRow>
              {staff.dateLeft && (
                <FieldRow label="Date Left" icon={<Calendar className="h-4 w-4" />}>
                  <span className="text-red-600">{staff.dateLeft}</span>
                </FieldRow>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* ── Assignments Tab ── */}
        <TabsContent value="assignments">
          <Card className="border-none p-6 shadow-sm ring-1 ring-gray-100">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-[#111827]">
                Subject & Section Assignments
              </h2>
              <Link
                href="/staff/assignments"
                className="border-input bg-background hover:bg-accent hover:text-accent-foreground inline-flex h-8 items-center justify-center gap-1.5 rounded-md border px-3 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Manage Assignments
              </Link>
            </div>

            {assignments === undefined ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
              </div>
            ) : assignments.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <BookOpen className="h-10 w-10 text-gray-300" />
                <p className="font-semibold text-gray-900">No assignments</p>
                <p className="text-sm text-gray-500">
                  This staff member has no subject-section assignments yet.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Subject</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead>Role</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((a: any) => (
                    <TableRow key={a._id}>
                      <TableCell className="font-medium">
                        {a.subjectName}
                        {a.subjectCode && (
                          <span className="ml-1.5 text-xs text-gray-400">({a.subjectCode})</span>
                        )}
                      </TableCell>
                      <TableCell>{a.sectionDisplayName}</TableCell>
                      <TableCell>{a.gradeName}</TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                            a.isPrimaryTeacher
                              ? 'bg-[#E8F5ED] text-[#2D9B4E]'
                              : 'bg-gray-100 text-gray-600',
                          )}
                        >
                          {a.isPrimaryTeacher ? 'Primary' : 'Supporting'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* ── Leave Tab ── */}
        <TabsContent value="leave">
          <Card className="border-none p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="font-heading mb-6 text-lg font-semibold text-[#111827]">
              Leave History
            </h2>

            {leaveRequests === undefined ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
              </div>
            ) : leaveRequests.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center">
                <Clock className="h-10 w-10 text-gray-300" />
                <p className="font-semibold text-gray-900">No leave requests</p>
                <p className="text-sm text-gray-500">
                  This staff member has no leave requests on record.
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Reason</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaveRequests.map((lr: any) => {
                    const statusColors: Record<string, string> = {
                      pending: 'bg-amber-100 text-amber-700',
                      approved: 'bg-green-100 text-green-700',
                      rejected: 'bg-red-100 text-red-700',
                    };
                    return (
                      <TableRow key={lr._id}>
                        <TableCell className="capitalize">
                          {lr.leaveType.replace(/_/g, ' ')}
                        </TableCell>
                        <TableCell>{lr.startDate}</TableCell>
                        <TableCell>{lr.endDate}</TableCell>
                        <TableCell>{lr.daysRequested}</TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              'inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                              statusColors[lr.status] ?? 'bg-gray-100 text-gray-600',
                            )}
                          >
                            {lr.status}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-gray-500">
                          {lr.reason}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </Card>
        </TabsContent>

        {/* ── Payroll Tab ── */}
        <TabsContent value="payroll">
          <Card className="border-none p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="font-heading mb-6 text-lg font-semibold text-[#111827]">
              Payroll & Banking Details
            </h2>
            <div className="grid gap-6 sm:grid-cols-2">
              <FieldRow label="Bank Name" icon={<CreditCard className="h-4 w-4" />}>
                {isEditing ? (
                  <Input
                    value={editData.bankName ?? ''}
                    onChange={(e) => setEditData({ ...editData, bankName: e.target.value })}
                    className="h-9"
                  />
                ) : (
                  <span className="text-gray-400">{staff.bankName || '—'}</span>
                )}
              </FieldRow>
              <FieldRow label="Account Number" icon={<CreditCard className="h-4 w-4" />}>
                {isEditing ? (
                  <Input
                    value={editData.bankAccountNumber ?? ''}
                    onChange={(e) =>
                      setEditData({ ...editData, bankAccountNumber: e.target.value })
                    }
                    className="h-9"
                  />
                ) : (
                  <span className="text-gray-400">{staff.bankAccountNumber || '—'}</span>
                )}
              </FieldRow>
              <FieldRow label="NAPSA Number" icon={<Shield className="h-4 w-4" />}>
                {isEditing ? (
                  <Input
                    value={editData.napsaNumber ?? ''}
                    onChange={(e) => setEditData({ ...editData, napsaNumber: e.target.value })}
                    className="h-9"
                    placeholder="National Pension Scheme Authority"
                  />
                ) : (
                  <span className="text-gray-400">{staff.napsaNumber || '—'}</span>
                )}
              </FieldRow>
              <FieldRow label="NHIMA Number" icon={<Shield className="h-4 w-4" />}>
                {isEditing ? (
                  <Input
                    value={editData.nhimaNumber ?? ''}
                    onChange={(e) => setEditData({ ...editData, nhimaNumber: e.target.value })}
                    className="h-9"
                    placeholder="National Health Insurance"
                  />
                ) : (
                  <span className="text-gray-400">{staff.nhimaNumber || '—'}</span>
                )}
              </FieldRow>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Field Row Helper ──

function FieldRow({
  label,
  icon,
  children,
}: {
  label: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <Label className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
        {icon}
        {label}
      </Label>
      <div className="text-sm text-[#111827]">{children}</div>
    </div>
  );
}
