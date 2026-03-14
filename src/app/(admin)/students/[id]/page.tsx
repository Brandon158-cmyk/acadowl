'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  User,
  Phone,
  Mail,
  Calendar,
  Edit2,
  Save,
  X,
  ArrowRightLeft,
  FileText,
  Upload,
  Trash2,
  Loader2,
  GraduationCap,
  Heart,
  Clock,
  Shield,
  BookOpen,
  Users,
  AlertTriangle,
} from 'lucide-react';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Id } from '../../../../../convex/_generated/dataModel';

// ── Status badge config ─────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-[#E8F5ED]', text: 'text-[#2D9B4E]', label: 'Active' },
  transferred_out: { bg: 'bg-[#EFF6FF]', text: 'text-[#2563EB]', label: 'Transferred' },
  graduated: { bg: 'bg-[#F5F3FF]', text: 'text-[#7C3AED]', label: 'Graduated' },
  withdrawn: { bg: 'bg-[#FEF2F2]', text: 'text-[#DC2626]', label: 'Withdrawn' },
  deceased: { bg: 'bg-[#F3F4F6]', text: 'text-[#6B7280]', label: 'Deceased' },
};

// ── Main Page ───────────────────────────────────────────────────────────────

export default function StudentProfilePage() {
  const params = useParams();
  const studentId = params.id as Id<'students'>;

  const student = useQuery(api.students.queries.getStudentById, { studentId });
  const documents = useQuery(api.students.documents.getDocumentsByStudent, { studentId });
  const transfers = useQuery(api.students.transfers.getTransfersByStudent, { studentId });

  const updateStudent = useMutation(api.students.mutations.updateStudent);
  const generateUploadUrl = useMutation(api.students.mutations.generateUploadUrl);
  const uploadDocument = useMutation(api.students.documents.uploadDocument);
  const deleteDocument = useMutation(api.students.documents.deleteDocument);
  const initiateTransferOut = useMutation(api.students.transfers.initiateTransferOut);

  // ── Edit state ──
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [isSaving, setIsSaving] = useState(false);

  // ── Transfer modal ──
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({
    toSchool: '',
    reason: '',
    transferDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [isTransferring, setIsTransferring] = useState(false);

  // ── Document upload ──
  const [isUploading, setIsUploading] = useState(false);

  if (student === undefined) {
    return (
      <div className="mx-auto max-w-5xl animate-pulse space-y-6 pb-10">
        <div className="h-48 rounded-2xl bg-gray-100" />
        <div className="h-96 rounded-2xl bg-gray-100" />
      </div>
    );
  }

  if (student === null) {
    return (
      <div className="mx-auto max-w-5xl pb-10">
        <Card className="flex flex-col items-center gap-4 border-none p-12 text-center shadow-sm ring-1 ring-gray-100">
          <AlertTriangle className="h-12 w-12 text-amber-400" />
          <h2 className="font-heading text-xl font-semibold text-[#111827]">Student Not Found</h2>
          <p className="text-sm text-[#6B7280]">
            The student you are looking for does not exist or you do not have access.
          </p>
          <Link href="/students">
            <Button className="mt-2 bg-[#2D9B4E] font-semibold hover:bg-[#217A3C]">
              Back to Students
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const statusStyle = STATUS_STYLES[student.status] ?? STATUS_STYLES.active;

  // ── Edit handlers ──
  const startEdit = () => {
    setEditData({
      firstName: student.firstName,
      lastName: student.lastName,
      middleName: student.middleName ?? '',
      preferredName: student.preferredName ?? '',
      dateOfBirth: student.dateOfBirth,
      nationality: student.nationality,
      homeLanguage: student.homeLanguage ?? '',
      religion: student.religion ?? '',
      boardingStatus: student.boardingStatus,
      medicalConditions: student.medicalConditions ?? '',
      allergies: student.allergies ?? '',
      medications: student.medications ?? '',
      specialNeeds: student.specialNeeds ?? '',
      doctorName: student.doctorName ?? '',
      doctorPhone: student.doctorPhone ?? '',
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
      await updateStudent({
        id: studentId,
        firstName: editData.firstName?.trim() || undefined,
        lastName: editData.lastName?.trim() || undefined,
        middleName: editData.middleName?.trim() || undefined,
        preferredName: editData.preferredName?.trim() || undefined,
        dateOfBirth: editData.dateOfBirth || undefined,
        nationality: editData.nationality?.trim() || undefined,
        homeLanguage: editData.homeLanguage?.trim() || undefined,
        religion: editData.religion?.trim() || undefined,
        boardingStatus: editData.boardingStatus || undefined,
        medicalConditions: editData.medicalConditions?.trim() || undefined,
        allergies: editData.allergies?.trim() || undefined,
        medications: editData.medications?.trim() || undefined,
        specialNeeds: editData.specialNeeds?.trim() || undefined,
        doctorName: editData.doctorName?.trim() || undefined,
        doctorPhone: editData.doctorPhone?.trim() || undefined,
      });
      toast.success('Student profile updated');
      setIsEditing(false);
    } catch (error: any) {
      toast.error(error.data ?? 'Failed to update student');
    } finally {
      setIsSaving(false);
    }
  };

  // ── Transfer handler ──
  const handleTransfer = async () => {
    if (!transferData.toSchool.trim() || !transferData.reason.trim()) {
      toast.error('Please fill in destination school and reason');
      return;
    }
    setIsTransferring(true);
    try {
      await initiateTransferOut({
        studentId,
        toSchool: transferData.toSchool.trim(),
        reason: transferData.reason.trim(),
        transferDate: transferData.transferDate,
        notes: transferData.notes.trim() || undefined,
      });
      toast.success('Transfer processed successfully');
      setShowTransferModal(false);
    } catch (error: any) {
      toast.error(error.data ?? 'Failed to process transfer');
    } finally {
      setIsTransferring(false);
    }
  };

  // ── Document upload handler ──
  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be smaller than 10MB');
      return;
    }

    setIsUploading(true);
    try {
      const uploadUrl = await generateUploadUrl();
      const result = await fetch(uploadUrl, {
        method: 'POST',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      const { storageId } = await result.json();

      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'other';
      await uploadDocument({
        studentId,
        type: 'other',
        title: file.name,
        storageId,
        fileType: ext,
      });
      toast.success('Document uploaded');
    } catch (error: any) {
      toast.error('Failed to upload document');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // ── Delete document handler ──
  const handleDeleteDocument = async (docId: Id<'studentDocuments'>) => {
    try {
      await deleteDocument({ documentId: docId });
      toast.success('Document deleted');
    } catch (error: any) {
      toast.error('Failed to delete document');
    }
  };

  // ── Compute age ──
  const age = (() => {
    const dob = new Date(student.dateOfBirth);
    const now = new Date();
    let a = now.getFullYear() - dob.getFullYear();
    const m = now.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) a--;
    return a;
  })();

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-10">
      {/* ── Breadcrumb ── */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink render={<Link href="/students" />} className="text-sm font-medium text-[#2D9B4E]">
              Students
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-sm font-semibold text-gray-500">
              {student.firstName} {student.lastName}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* ── Profile Header ── */}
      <Card className="border-none p-6 shadow-sm ring-1 ring-gray-100">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-5">
            {/* Avatar */}
            <Avatar className="h-20 w-20 rounded-2xl border-2 border-gray-100 shadow-sm">
              {student.photoUrl ? (
                <AvatarImage src={student.photoUrl} alt={`${student.firstName} ${student.lastName}`} className="rounded-2xl" />
              ) : null}
              <AvatarFallback className="rounded-2xl bg-[#2D9B4E]/10 text-2xl font-bold text-[#2D9B4E]">
                {student.firstName.charAt(0)}
                {student.lastName.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="space-y-1.5">
              <h1 className="font-heading text-2xl font-bold tracking-tight text-[#111827]">
                {student.firstName} {student.middleName ? student.middleName + ' ' : ''}
                {student.lastName}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[13px] text-[#6B7280]">
                  {student.studentNumber}
                </span>
                <span className="text-gray-300">·</span>
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
                {student.grade && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="text-[13px] font-medium text-[#374151]">
                      {student.grade.name}
                    </span>
                  </>
                )}
                {student.section && (
                  <>
                    <span className="text-gray-300">·</span>
                    <span className="text-[13px] text-[#6B7280]">
                      {student.section.displayName}
                    </span>
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 pt-1 text-[13px] text-[#6B7280]">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {age} years old
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  {student.gender === 'M' ? 'Male' : 'Female'}
                </span>
                <Badge
                  variant="secondary"
                  className={cn(
                    'rounded-full text-[11px] font-semibold',
                    student.boardingStatus === 'boarding'
                      ? 'bg-[#FFFBEB] text-[#D97706]'
                      : 'bg-[#F3F4F6] text-[#374151]',
                  )}
                >
                  {student.boardingStatus === 'boarding' ? 'Boarding' : 'Day'}
                </Badge>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            {!isEditing && student.status === 'active' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={startEdit}
                  className="h-9 gap-1.5 rounded-lg border-gray-200 text-sm"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                  Edit Profile
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowTransferModal(true)}
                  className="h-9 gap-1.5 rounded-lg border-gray-200 text-sm text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                >
                  <ArrowRightLeft className="h-3.5 w-3.5" />
                  Transfer Out
                </Button>
              </>
            )}
            {isEditing && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={cancelEdit}
                  className="h-9 gap-1.5 rounded-lg border-gray-200 text-sm"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={saveEdit}
                  disabled={isSaving}
                  className="h-9 gap-1.5 rounded-lg bg-[#2D9B4E] text-sm font-semibold hover:bg-[#217A3C]"
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Save className="h-3.5 w-3.5" />
                  )}
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* ── Tabs ── */}
      <Tabs defaultValue="overview">
        <TabsList variant="line" className="mb-6 border-b border-[#E5E7EB] pb-0">
          <TabsTrigger value="overview" className="gap-1.5 pb-3 text-sm">
            <BookOpen className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="guardians" className="gap-1.5 pb-3 text-sm">
            <Users className="h-4 w-4" />
            Guardians
          </TabsTrigger>
          <TabsTrigger value="medical" className="gap-1.5 pb-3 text-sm">
            <Heart className="h-4 w-4" />
            Medical
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-1.5 pb-3 text-sm">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 pb-3 text-sm">
            <Clock className="h-4 w-4" />
            History
          </TabsTrigger>
        </TabsList>

        {/* ── Overview Tab ── */}
        <TabsContent value="overview">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Attendance Card */}
            <Card className="border-none p-5 shadow-sm ring-1 ring-gray-100">
              <h3 className="mb-3 text-[13px] font-semibold uppercase tracking-[0.06em] text-[#6B7280]">
                Attendance (Current Term)
              </h3>
              <div className="flex items-end gap-3">
                <span className="font-heading text-4xl font-bold text-[#111827]">
                  {student.attendanceSummary.attendancePercent}%
                </span>
                <span className="mb-1 text-sm text-[#6B7280]">present</span>
              </div>
              <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[#E5E7EB]">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-500',
                    student.attendanceSummary.attendancePercent >= 80
                      ? 'bg-[#2D9B4E]'
                      : student.attendanceSummary.attendancePercent >= 60
                        ? 'bg-[#D97706]'
                        : 'bg-[#DC2626]',
                  )}
                  style={{ width: `${student.attendanceSummary.attendancePercent}%` }}
                />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 text-[12px]">
                <span className="text-[#6B7280]">
                  Present: <strong className="text-[#111827]">{student.attendanceSummary.presentDays}</strong>
                </span>
                <span className="text-[#6B7280]">
                  Absent: <strong className="text-[#111827]">{student.attendanceSummary.absentDays}</strong>
                </span>
                <span className="text-[#6B7280]">
                  Late: <strong className="text-[#111827]">{student.attendanceSummary.lateDays}</strong>
                </span>
                <span className="text-[#6B7280]">
                  Excused: <strong className="text-[#111827]">{student.attendanceSummary.excusedDays}</strong>
                </span>
              </div>
            </Card>

            {/* Personal Details */}
            <Card className="border-none p-5 shadow-sm ring-1 ring-gray-100 lg:col-span-2">
              <h3 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-[#6B7280]">
                Personal Details
              </h3>
              {isEditing ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[12px] text-[#6B7280]">First Name</Label>
                    <Input
                      value={editData.firstName ?? ''}
                      onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                      className="h-10 rounded-lg border-[1.5px] border-[#D1D5DB] text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[12px] text-[#6B7280]">Last Name</Label>
                    <Input
                      value={editData.lastName ?? ''}
                      onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                      className="h-10 rounded-lg border-[1.5px] border-[#D1D5DB] text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[12px] text-[#6B7280]">Nationality</Label>
                    <Input
                      value={editData.nationality ?? ''}
                      onChange={(e) => setEditData({ ...editData, nationality: e.target.value })}
                      className="h-10 rounded-lg border-[1.5px] border-[#D1D5DB] text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[12px] text-[#6B7280]">Home Language</Label>
                    <Input
                      value={editData.homeLanguage ?? ''}
                      onChange={(e) => setEditData({ ...editData, homeLanguage: e.target.value })}
                      className="h-10 rounded-lg border-[1.5px] border-[#D1D5DB] text-sm"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[12px] text-[#6B7280]">Boarding Status</Label>
                    <Select
                      value={editData.boardingStatus ?? 'day'}
                      onValueChange={(val) => setEditData({ ...editData, boardingStatus: val })}
                    >
                      <SelectTrigger className="h-10 rounded-lg border-[1.5px] border-[#D1D5DB] text-sm">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="day">Day Scholar</SelectItem>
                        <SelectItem value="boarding">Boarding</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-[12px] text-[#6B7280]">Religion</Label>
                    <Input
                      value={editData.religion ?? ''}
                      onChange={(e) => setEditData({ ...editData, religion: e.target.value })}
                      className="h-10 rounded-lg border-[1.5px] border-[#D1D5DB] text-sm"
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
                  <DetailItem label="Date of Birth" value={student.dateOfBirth} />
                  <DetailItem label="Gender" value={student.gender === 'M' ? 'Male' : 'Female'} />
                  <DetailItem label="Nationality" value={student.nationality} />
                  <DetailItem label="Home Language" value={student.homeLanguage} />
                  <DetailItem label="Religion" value={student.religion} />
                  <DetailItem label="NRC" value={student.nrc} />
                  <DetailItem label="Birth Certificate" value={student.birthCertNumber} />
                  <DetailItem label="Blood Group" value={student.bloodGroup} />
                  <DetailItem label="Admission Date" value={student.admissionDate} />
                  <DetailItem label="Previous School" value={student.previousSchool} />
                  <DetailItem
                    label="Academic Year"
                    value={student.academicYear?.label}
                  />
                </div>
              )}
            </Card>

            {/* Recent Results */}
            {student.recentResults.length > 0 && (
              <Card className="border-none p-5 shadow-sm ring-1 ring-gray-100 lg:col-span-3">
                <h3 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-[#6B7280]">
                  Recent Exam Results
                </h3>
                <Table>
                  <TableHeader>
                    <TableRow className="border-b-2 border-[#E5E7EB] bg-[#F9FAFB] hover:bg-[#F9FAFB]">
                      <TableHead className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6B7280]">
                        Subject
                      </TableHead>
                      <TableHead className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6B7280]">
                        Exam
                      </TableHead>
                      <TableHead className="px-4 py-2.5 text-right text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6B7280]">
                        Score
                      </TableHead>
                      <TableHead className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-[#6B7280]">
                        Grade
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {student.recentResults.map((result: any) => (
                      <TableRow
                        key={result._id}
                        className="border-b border-[#F3F4F6]"
                      >
                        <TableCell className="px-4 py-2.5 text-[13px] font-medium text-[#111827]">
                          {result.subjectName}
                        </TableCell>
                        <TableCell className="px-4 py-2.5 text-[13px] text-[#6B7280]">
                          {result.sessionName}
                        </TableCell>
                        <TableCell className="px-4 py-2.5 text-right font-mono text-[13px] font-semibold text-[#111827]">
                          {result.score ?? '—'}%
                        </TableCell>
                        <TableCell className="px-4 py-2.5 text-[13px] text-[#6B7280]">
                          {result.grade ?? '—'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* ── Guardians Tab ── */}
        <TabsContent value="guardians">
          <div className="space-y-4">
            {(!student.guardians || student.guardians.length === 0) && (
              <Card className="flex flex-col items-center gap-3 border-none p-8 text-center shadow-sm ring-1 ring-gray-100">
                <Users className="h-10 w-10 text-gray-200" />
                <p className="text-sm font-medium text-[#6B7280]">No guardians linked</p>
              </Card>
            )}
            {student.guardians?.map((link: any, idx: number) => (
              <Card
                key={idx}
                className="border-none p-5 shadow-sm ring-1 ring-gray-100"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
                      <Shield className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-heading text-[15px] font-semibold text-[#111827]">
                          {link.guardian
                            ? `${link.guardian.firstName} ${link.guardian.lastName}`
                            : 'Unknown Guardian'}
                        </h4>
                        {link.isPrimary && (
                          <span className="rounded-full bg-[#E8F5ED] px-2 py-0.5 text-[10px] font-semibold text-[#2D9B4E]">
                            Primary
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-[13px] capitalize text-[#6B7280]">
                        {link.relation}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-4 text-[13px] text-[#6B7280]">
                        {link.guardian?.phone && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" />
                            {link.guardian.phone}
                          </span>
                        )}
                        {link.guardian?.email && (
                          <span className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5" />
                            {link.guardian.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                {/* Permissions */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {link.canPayFees && (
                    <span className="rounded-md bg-[#F3F4F6] px-2 py-1 text-[11px] font-medium text-[#374151]">
                      Pay Fees
                    </span>
                  )}
                  {link.canSeeResults && (
                    <span className="rounded-md bg-[#F3F4F6] px-2 py-1 text-[11px] font-medium text-[#374151]">
                      View Results
                    </span>
                  )}
                  {link.canSeeAttendance && (
                    <span className="rounded-md bg-[#F3F4F6] px-2 py-1 text-[11px] font-medium text-[#374151]">
                      View Attendance
                    </span>
                  )}
                  {link.receiveSMS && (
                    <span className="rounded-md bg-[#F3F4F6] px-2 py-1 text-[11px] font-medium text-[#374151]">
                      SMS
                    </span>
                  )}
                  {link.isEmergencyContact && (
                    <span className="rounded-md bg-[#FEF2F2] px-2 py-1 text-[11px] font-medium text-[#DC2626]">
                      Emergency Contact
                    </span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── Medical Tab ── */}
        <TabsContent value="medical">
          <Card className="border-none p-6 shadow-sm ring-1 ring-gray-100">
            <h3 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.06em] text-[#6B7280]">
              Health Information
            </h3>
            {isEditing ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[12px] text-[#6B7280]">Medical Conditions</Label>
                  <Textarea
                    value={editData.medicalConditions ?? ''}
                    onChange={(e) => setEditData({ ...editData, medicalConditions: e.target.value })}
                    rows={3}
                    className="rounded-lg border-[1.5px] border-[#D1D5DB] text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[12px] text-[#6B7280]">Allergies</Label>
                  <Textarea
                    value={editData.allergies ?? ''}
                    onChange={(e) => setEditData({ ...editData, allergies: e.target.value })}
                    rows={3}
                    className="rounded-lg border-[1.5px] border-[#D1D5DB] text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[12px] text-[#6B7280]">Medications</Label>
                  <Textarea
                    value={editData.medications ?? ''}
                    onChange={(e) => setEditData({ ...editData, medications: e.target.value })}
                    rows={3}
                    className="rounded-lg border-[1.5px] border-[#D1D5DB] text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[12px] text-[#6B7280]">Special Needs</Label>
                  <Textarea
                    value={editData.specialNeeds ?? ''}
                    onChange={(e) => setEditData({ ...editData, specialNeeds: e.target.value })}
                    rows={3}
                    className="rounded-lg border-[1.5px] border-[#D1D5DB] text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[12px] text-[#6B7280]">Doctor Name</Label>
                  <Input
                    value={editData.doctorName ?? ''}
                    onChange={(e) => setEditData({ ...editData, doctorName: e.target.value })}
                    className="h-10 rounded-lg border-[1.5px] border-[#D1D5DB] text-sm"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-[12px] text-[#6B7280]">Doctor Phone</Label>
                  <Input
                    value={editData.doctorPhone ?? ''}
                    onChange={(e) => setEditData({ ...editData, doctorPhone: e.target.value })}
                    className="h-10 rounded-lg border-[1.5px] border-[#D1D5DB] text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2">
                <DetailItem label="Blood Group" value={student.bloodGroup} />
                <DetailItem label="Medical Conditions" value={student.medicalConditions} />
                <DetailItem label="Allergies" value={student.allergies} />
                <DetailItem label="Medications" value={student.medications} />
                <DetailItem label="Special Needs" value={student.specialNeeds} />
                <DetailItem label="Doctor" value={student.doctorName} />
                <DetailItem label="Doctor Phone" value={student.doctorPhone} />
              </div>
            )}
          </Card>
        </TabsContent>

        {/* ── Documents Tab ── */}
        <TabsContent value="documents">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#6B7280]">
                Student Documents
              </h3>
              <Button
                type="button"
                disabled={isUploading}
                onClick={() => document.getElementById('doc-upload')?.click()}
                className={cn(
                  'gap-2 bg-[#2D9B4E] font-semibold hover:bg-[#217A3C]',
                  isUploading && 'pointer-events-none opacity-60',
                )}
              >
                {isUploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Upload Document
              </Button>
              <Input
                id="doc-upload"
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                onChange={handleDocumentUpload}
                className="hidden"
              />
            </div>

            {(!documents || documents.length === 0) && (
              <Card className="flex flex-col items-center gap-3 border-none p-8 text-center shadow-sm ring-1 ring-gray-100">
                <FileText className="h-10 w-10 text-gray-200" />
                <p className="text-sm font-medium text-[#6B7280]">No documents uploaded</p>
                <p className="text-[12px] text-[#9CA3AF]">
                  Upload birth certificates, medical records, transfer letters, etc.
                </p>
              </Card>
            )}

            {documents?.map((doc: any) => (
              <Card
                key={doc._id}
                className="flex items-center justify-between border-none p-4 shadow-sm ring-1 ring-gray-100"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#F3F4F6]">
                    <FileText className="h-5 w-5 text-[#6B7280]" />
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-[#111827]">{doc.title}</p>
                    <p className="text-[12px] text-[#9CA3AF]">
                      {doc.type.replace(/_/g, ' ')} · {doc.fileType.toUpperCase()} · Uploaded by{' '}
                      {doc.uploadedByName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-medium text-[#2D9B4E] hover:underline"
                    >
                      View
                    </a>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteDocument(doc._id)}
                    className="h-8 w-8 text-gray-400 hover:bg-red-50 hover:text-[#DC2626]"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── History Tab ── */}
        <TabsContent value="history">
          <div className="space-y-4">
            <h3 className="text-[13px] font-semibold uppercase tracking-[0.06em] text-[#6B7280]">
              Transfer History
            </h3>

            {(!transfers || transfers.length === 0) && (
              <Card className="flex flex-col items-center gap-3 border-none p-8 text-center shadow-sm ring-1 ring-gray-100">
                <ArrowRightLeft className="h-10 w-10 text-gray-200" />
                <p className="text-sm font-medium text-[#6B7280]">No transfer records</p>
              </Card>
            )}

            {transfers?.map((transfer: any) => (
              <Card
                key={transfer._id}
                className="border-none p-4 shadow-sm ring-1 ring-gray-100"
              >
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg',
                      transfer.direction === 'in'
                        ? 'bg-[#E8F5ED] text-[#2D9B4E]'
                        : 'bg-[#FEF2F2] text-[#DC2626]',
                    )}
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[14px] font-medium text-[#111827]">
                      Transfer {transfer.direction === 'in' ? 'In' : 'Out'}
                    </p>
                    <p className="text-[13px] text-[#6B7280]">
                      {transfer.direction === 'in'
                        ? `From ${transfer.fromSchool}`
                        : `To ${transfer.toSchool}`}{' '}
                      · {transfer.transferDate}
                    </p>
                    <p className="mt-1 text-[12px] text-[#9CA3AF]">
                      Reason: {transfer.reason} · Processed by {transfer.processedByName}
                    </p>
                    {transfer.notes && (
                      <p className="mt-1 text-[12px] italic text-[#9CA3AF]">{transfer.notes}</p>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* ── Transfer Out Modal ── */}
      <Dialog open={showTransferModal} onOpenChange={setShowTransferModal}>
        <DialogContent className="max-w-lg rounded-2xl p-8">
          <DialogTitle className="font-heading text-xl font-semibold text-[#111827]">
            Transfer Student Out
          </DialogTitle>
          <DialogDescription className="text-sm text-[#6B7280]">
            Transfer {student.firstName} {student.lastName} to another school. This will set their
            status to &quot;Transferred&quot;.
          </DialogDescription>

          <div className="mt-4 space-y-4">
            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px] font-medium text-[#374151]">
                Destination School <span className="text-[#DC2626]">*</span>
              </Label>
              <Input
                value={transferData.toSchool}
                onChange={(e) => setTransferData({ ...transferData, toSchool: e.target.value })}
                placeholder="Name of receiving school"
                className="h-[48px] rounded-lg border-[1.5px] border-[#D1D5DB] text-sm focus:border-[#2D9B4E] focus:ring-[#2D9B4E]/15"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px] font-medium text-[#374151]">
                Reason <span className="text-[#DC2626]">*</span>
              </Label>
              <Textarea
                value={transferData.reason}
                onChange={(e) => setTransferData({ ...transferData, reason: e.target.value })}
                placeholder="Reason for transfer..."
                rows={3}
                className="rounded-lg border-[1.5px] border-[#D1D5DB] text-sm focus:border-[#2D9B4E] focus:ring-[#2D9B4E]/15"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px] font-medium text-[#374151]">Transfer Date</Label>
              <Input
                type="date"
                value={transferData.transferDate}
                onChange={(e) => setTransferData({ ...transferData, transferDate: e.target.value })}
                className="h-[48px] rounded-lg border-[1.5px] border-[#D1D5DB] text-sm focus:border-[#2D9B4E] focus:ring-[#2D9B4E]/15"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label className="text-[13px] font-medium text-[#374151]">Notes</Label>
              <Textarea
                value={transferData.notes}
                onChange={(e) => setTransferData({ ...transferData, notes: e.target.value })}
                placeholder="Optional notes..."
                rows={2}
                className="rounded-lg border-[1.5px] border-[#D1D5DB] text-sm focus:border-[#2D9B4E] focus:ring-[#2D9B4E]/15"
              />
            </div>
          </div>

          <DialogFooter className="mt-6 gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowTransferModal(false)}
              className="text-[#6B7280]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleTransfer}
              disabled={isTransferring}
              className="bg-amber-600 font-semibold hover:bg-amber-700"
            >
              {isTransferring ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ArrowRightLeft className="mr-2 h-4 w-4" />
              )}
              Confirm Transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Detail display helper ───────────────────────────────────────────────────

function DetailItem({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-[12px] font-medium text-[#9CA3AF]">{label}</p>
      <p className="text-[14px] text-[#111827]">{value || '—'}</p>
    </div>
  );
}
