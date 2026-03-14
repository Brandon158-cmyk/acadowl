'use client';

import { useQuery, useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
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
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  ChevronRight,
  ChevronLeft,
  User,
  BookOpen,
  Users,
  FileText,
  Check,
  Upload,
  Loader2,
  AlertTriangle,
  Search,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Id } from '../../../../../convex/_generated/dataModel';
import Link from 'next/link';

// ── Step indicator ──────────────────────────────────────────────────────────

const STEPS = [
  { label: 'Personal Info', icon: User },
  { label: 'Academic Placement', icon: BookOpen },
  { label: 'Guardian Info', icon: Users },
  { label: 'Review & Submit', icon: FileText },
] as const;

function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <nav aria-label="Enrolment progress" className="mb-8">
      <ol className="flex items-center gap-2">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === currentStep;
          const isComplete = idx < currentStep;

          return (
            <li key={idx} className="flex items-center gap-2">
              {idx > 0 && (
                <div
                  className={cn(
                    'hidden h-[2px] w-8 sm:block md:w-12',
                    isComplete ? 'bg-[#2D9B4E]' : 'bg-[#E5E7EB]',
                  )}
                />
              )}
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-all',
                    isComplete && 'bg-[#2D9B4E] text-white',
                    isActive && 'bg-[#2D9B4E]/10 text-[#2D9B4E] ring-2 ring-[#2D9B4E]',
                    !isActive && !isComplete && 'bg-[#F3F4F6] text-[#9CA3AF]',
                  )}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span
                  className={cn(
                    'hidden text-[13px] font-medium sm:inline',
                    isActive ? 'text-[#111827]' : 'text-[#9CA3AF]',
                  )}
                >
                  {step.label}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

// ── Form field helper ───────────────────────────────────────────────────────

function FormField({
  label,
  required,
  error,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[13px] font-medium text-[#374151]">
        {label}
        {required && <span className="ml-0.5 text-[#DC2626]">*</span>}
      </Label>
      {children}
      {hint && !error && <p className="text-[12px] text-[#9CA3AF]">{hint}</p>}
      {error && <p className="text-[12px] font-medium text-[#DC2626]">{error}</p>}
    </div>
  );
}

// ── Types ───────────────────────────────────────────────────────────────────

interface PersonalInfo {
  firstName: string;
  lastName: string;
  middleName: string;
  preferredName: string;
  dateOfBirth: string;
  gender: string;
  nrc: string;
  birthCertNumber: string;
  nationality: string;
  homeLanguage: string;
  religion: string;
  bloodGroup: string;
}

interface AcademicInfo {
  gradeId: string;
  sectionId: string;
  boardingStatus: string;
  mealPlanType: string;
  admissionDate: string;
  previousSchool: string;
}

interface GuardianInfo {
  firstName: string;
  lastName: string;
  phone: string;
  altPhone: string;
  email: string;
  nrc: string;
  relation: string;
  canPayFees: boolean;
  canSeeResults: boolean;
  canSeeAttendance: boolean;
  receiveSMS: boolean;
  isEmergencyContact: boolean;
}

interface HealthInfo {
  medicalConditions: string;
  medications: string;
  allergies: string;
  specialNeeds: string;
  doctorName: string;
  doctorPhone: string;
}

// ── Main Page ───────────────────────────────────────────────────────────────

export default function EnrolStudentPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ── Data sources ──
  const grades = useQuery(api.academics.grades.getGradesBySchool) ?? [];
  const activeYear = useQuery(api.schools.academicYears.getCurrentAcademicYear);
  const enrolStudent = useMutation(api.students.mutations.enrolStudent);
  const generateUploadUrl = useMutation(api.students.mutations.generateUploadUrl);

  // ── Form state ──
  const [personal, setPersonal] = useState<PersonalInfo>({
    firstName: '',
    lastName: '',
    middleName: '',
    preferredName: '',
    dateOfBirth: '',
    gender: '',
    nrc: '',
    birthCertNumber: '',
    nationality: 'Zambian',
    homeLanguage: '',
    religion: '',
    bloodGroup: '',
  });

  const [academic, setAcademic] = useState<AcademicInfo>({
    gradeId: '',
    sectionId: '',
    boardingStatus: 'day',
    mealPlanType: 'none',
    admissionDate: new Date().toISOString().split('T')[0],
    previousSchool: '',
  });

  const [primaryGuardian, setPrimaryGuardian] = useState<GuardianInfo>({
    firstName: '',
    lastName: '',
    phone: '',
    altPhone: '',
    email: '',
    nrc: '',
    relation: 'parent',
    canPayFees: true,
    canSeeResults: true,
    canSeeAttendance: true,
    receiveSMS: true,
    isEmergencyContact: true,
  });

  const [hasSecondGuardian, setHasSecondGuardian] = useState(false);
  const [secondGuardian, setSecondGuardian] = useState<GuardianInfo>({
    firstName: '',
    lastName: '',
    phone: '',
    altPhone: '',
    email: '',
    nrc: '',
    relation: 'parent',
    canPayFees: false,
    canSeeResults: true,
    canSeeAttendance: true,
    receiveSMS: false,
    isEmergencyContact: false,
  });

  const [health, setHealth] = useState<HealthInfo>({
    medicalConditions: '',
    medications: '',
    allergies: '',
    specialNeeds: '',
    doctorName: '',
    doctorPhone: '',
  });

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // ── Guardian search ──
  const [guardianSearchPhone, setGuardianSearchPhone] = useState('');
  const guardianSearchResult = useQuery(
    api.students.guardians.searchGuardianByPhone,
    guardianSearchPhone.length >= 4 ? { phone: guardianSearchPhone } : 'skip',
  );

  // ── Sections for selected grade ──
  const sections = useQuery(
    api.academics.sections.getSectionsByGrade,
    academic.gradeId && activeYear
      ? {
          gradeId: academic.gradeId as Id<'grades'>,
          academicYearId: activeYear._id,
        }
      : 'skip',
  );

  // ── Photo handler ──
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Photo must be smaller than 5MB');
      return;
    }
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setPhotoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  // ── Validation ──
  const validateStep = (stepIndex: number): boolean => {
    const newErrors: Record<string, string> = {};

    if (stepIndex === 0) {
      if (!personal.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!personal.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!personal.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
      if (!personal.gender) newErrors.gender = 'Gender is required';
      if (!personal.nationality.trim()) newErrors.nationality = 'Nationality is required';

      if (personal.dateOfBirth) {
        const dob = new Date(personal.dateOfBirth);
        const now = new Date();
        let age = now.getFullYear() - dob.getFullYear();
        const m = now.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
        if (age < 3) newErrors.dateOfBirth = 'Student must be at least 3 years old';
      }
    }

    if (stepIndex === 1) {
      if (!academic.gradeId) newErrors.gradeId = 'Grade is required';
      if (!academic.sectionId) newErrors.sectionId = 'Section is required';
      if (!academic.admissionDate) newErrors.admissionDate = 'Admission date is required';
    }

    if (stepIndex === 2) {
      if (!primaryGuardian.firstName.trim())
        newErrors['guardian.firstName'] = 'Guardian first name is required';
      if (!primaryGuardian.lastName.trim())
        newErrors['guardian.lastName'] = 'Guardian last name is required';
      if (!primaryGuardian.phone.trim())
        newErrors['guardian.phone'] = 'Guardian phone is required';
      if (!primaryGuardian.relation) newErrors['guardian.relation'] = 'Relation is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ── Navigation ──
  const goNext = () => {
    if (validateStep(step)) {
      setStep(step + 1);
    }
  };
  const goBack = () => setStep(Math.max(0, step - 1));

  // ── Computed age ──
  const computeAge = (dob: string) => {
    if (!dob) return '';
    const birthDate = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birthDate.getFullYear();
    const m = now.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) age--;
    return `${age} years old`;
  };

  // ── Fill guardian from search ──
  const fillGuardianFromSearch = () => {
    if (guardianSearchResult) {
      setPrimaryGuardian((prev) => ({
        ...prev,
        firstName: guardianSearchResult.firstName,
        lastName: guardianSearchResult.lastName,
        phone: guardianSearchResult.phone,
        altPhone: guardianSearchResult.altPhone ?? '',
        email: guardianSearchResult.email ?? '',
        nrc: guardianSearchResult.nrc ?? '',
      }));
      setGuardianSearchPhone('');
    }
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (!validateStep(2)) {
      setStep(2);
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload photo if provided
      let photoStorageId: Id<'_storage'> | undefined;
      if (photoFile) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: 'POST',
          headers: { 'Content-Type': photoFile.type },
          body: photoFile,
        });
        const { storageId } = await result.json();
        photoStorageId = storageId;
      }

      const result = await enrolStudent({
        firstName: personal.firstName.trim(),
        lastName: personal.lastName.trim(),
        middleName: personal.middleName.trim() || undefined,
        preferredName: personal.preferredName.trim() || undefined,
        dateOfBirth: personal.dateOfBirth,
        gender: personal.gender as 'M' | 'F',
        nrc: personal.nrc.trim() || undefined,
        birthCertNumber: personal.birthCertNumber.trim() || undefined,
        nationality: personal.nationality.trim(),
        homeLanguage: personal.homeLanguage.trim() || undefined,
        religion: personal.religion.trim() || undefined,
        photoStorageId,
        currentSectionId: academic.sectionId as Id<'sections'>,
        currentGradeId: academic.gradeId as Id<'grades'>,
        admissionDate: academic.admissionDate,
        previousSchool: academic.previousSchool.trim() || undefined,
        boardingStatus: academic.boardingStatus as 'day' | 'boarding',
        mealPlanType:
          academic.boardingStatus === 'boarding'
            ? (academic.mealPlanType as 'full_board' | 'half_board' | 'none')
            : undefined,
        bloodGroup: personal.bloodGroup || undefined,
        medicalConditions: health.medicalConditions.trim() || undefined,
        medications: health.medications.trim() || undefined,
        allergies: health.allergies.trim() || undefined,
        specialNeeds: health.specialNeeds.trim() || undefined,
        doctorName: health.doctorName.trim() || undefined,
        doctorPhone: health.doctorPhone.trim() || undefined,
        guardian: {
          firstName: primaryGuardian.firstName.trim(),
          lastName: primaryGuardian.lastName.trim(),
          phone: primaryGuardian.phone.trim(),
          altPhone: primaryGuardian.altPhone.trim() || undefined,
          email: primaryGuardian.email.trim() || undefined,
          nrc: primaryGuardian.nrc.trim() || undefined,
          relation: primaryGuardian.relation,
          canPayFees: primaryGuardian.canPayFees,
          canSeeResults: primaryGuardian.canSeeResults,
          canSeeAttendance: primaryGuardian.canSeeAttendance,
          receiveSMS: primaryGuardian.receiveSMS,
          isEmergencyContact: primaryGuardian.isEmergencyContact,
        },
        secondGuardian: hasSecondGuardian
          ? {
              firstName: secondGuardian.firstName.trim(),
              lastName: secondGuardian.lastName.trim(),
              phone: secondGuardian.phone.trim(),
              altPhone: secondGuardian.altPhone.trim() || undefined,
              email: secondGuardian.email.trim() || undefined,
              nrc: secondGuardian.nrc.trim() || undefined,
              relation: secondGuardian.relation,
              canPayFees: secondGuardian.canPayFees,
              canSeeResults: secondGuardian.canSeeResults,
              canSeeAttendance: secondGuardian.canSeeAttendance,
              receiveSMS: secondGuardian.receiveSMS,
              isEmergencyContact: secondGuardian.isEmergencyContact,
            }
          : undefined,
      });

      toast.success(`Student enrolled successfully! Number: ${result.studentNumber}`);
      router.push(`/students/${result.studentId}`);
    } catch (error: any) {
      toast.error(error.data ?? error.message ?? 'Failed to enrol student');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── No active academic year guard ──
  if (activeYear === null) {
    return (
      <div className="mx-auto max-w-3xl space-y-6 pb-10">
        <Card className="flex items-start gap-4 border-none bg-amber-50 p-6 ring-1 ring-amber-200">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="font-semibold text-amber-900">No active academic year</p>
            <p className="mt-0.5 text-sm text-amber-700">
              Activate an academic year before enrolling students.{' '}
              <Link
                href="/settings/academic-year"
                className="underline underline-offset-2 hover:text-amber-900"
              >
                Set up academic year →
              </Link>
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // ── Resolve section/grade names for review step ──
  const selectedGrade = grades.find((g) => g._id === academic.gradeId);
  const selectedSection = (sections ?? []).find((s: any) => s._id === academic.sectionId);

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-10">
      {/* Header */}
      <div>
        <Breadcrumb className="mb-1">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/students" />} className="text-sm font-medium text-[#2D9B4E]">
                Students
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-sm font-semibold text-gray-500">
                Enrol Student
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-[#111827]">
          Enrol New Student
        </h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Complete all steps to enrol a new student into the system.
        </p>
      </div>

      <StepIndicator currentStep={step} />

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* Step 1: Personal Information */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {step === 0 && (
        <Card className="space-y-6 border-none p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="font-heading text-lg font-semibold text-[#111827]">
            Personal Information
          </h2>

          {/* Photo Upload */}
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 rounded-full border-2 border-[#E5E7EB]">
              {photoPreview ? (
                <AvatarImage src={photoPreview} alt="Student photo" />
              ) : null}
              <AvatarFallback className="h-20 w-20 rounded-full bg-[#F3F4F6]">
                <User className="h-8 w-8 text-[#9CA3AF]" />
              </AvatarFallback>
            </Avatar>
            <div>
              <Button
                variant="outline"
                type="button"
                className="gap-2 rounded-lg border-gray-200 text-sm font-medium text-[#374151] hover:bg-gray-50"
                onClick={() => document.getElementById('photo-upload')?.click()}
              >
                <Upload className="h-4 w-4" />
                {photoPreview ? 'Change Photo' : 'Upload Photo'}
              </Button>
              <Input
                id="photo-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoChange}
                className="hidden"
              />
              <p className="mt-1 text-[12px] text-[#9CA3AF]">JPG, PNG or WebP. Max 5MB.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField label="First Name" required error={errors.firstName}>
              <Input
                value={personal.firstName}
                onChange={(e) => setPersonal({ ...personal, firstName: e.target.value })}
                placeholder="e.g. Chanda"
                className="h-[48px] rounded-lg border-[1.5px] border-[#D1D5DB] text-sm focus:border-[#2D9B4E] focus:ring-[#2D9B4E]/15"
              />
            </FormField>
            <FormField label="Last Name" required error={errors.lastName}>
              <Input
                value={personal.lastName}
                onChange={(e) => setPersonal({ ...personal, lastName: e.target.value })}
                placeholder="e.g. Mwanza"
                className="h-[48px] rounded-lg border-[1.5px] border-[#D1D5DB] text-sm focus:border-[#2D9B4E] focus:ring-[#2D9B4E]/15"
              />
            </FormField>
            <FormField label="Middle Name">
              <Input
                value={personal.middleName}
                onChange={(e) => setPersonal({ ...personal, middleName: e.target.value })}
                placeholder="Optional"
                className="h-[48px] rounded-lg border-[1.5px] border-[#D1D5DB] text-sm focus:border-[#2D9B4E] focus:ring-[#2D9B4E]/15"
              />
            </FormField>
            <FormField label="Preferred Name" hint="If different from first name">
              <Input
                value={personal.preferredName}
                onChange={(e) => setPersonal({ ...personal, preferredName: e.target.value })}
                placeholder="Optional"
                className="h-[48px] rounded-lg border-[1.5px] border-[#D1D5DB] text-sm focus:border-[#2D9B4E] focus:ring-[#2D9B4E]/15"
              />
            </FormField>
            <FormField
              label="Date of Birth"
              required
              error={errors.dateOfBirth}
              hint={personal.dateOfBirth ? computeAge(personal.dateOfBirth) : undefined}
            >
              <Input
                type="date"
                value={personal.dateOfBirth}
                onChange={(e) => setPersonal({ ...personal, dateOfBirth: e.target.value })}
                className="h-[48px] rounded-lg border-[1.5px] border-[#D1D5DB] text-sm focus:border-[#2D9B4E] focus:ring-[#2D9B4E]/15"
              />
            </FormField>
            <FormField label="Gender" required error={errors.gender}>
              <Select
                value={personal.gender}
                onValueChange={(val) => val && setPersonal({ ...personal, gender: val })}
              >
                <SelectTrigger className="h-[48px] rounded-lg border-[1.5px] border-[#D1D5DB] text-sm">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
            <FormField label="NRC Number">
              <Input
                value={personal.nrc}
                onChange={(e) => setPersonal({ ...personal, nrc: e.target.value })}
                placeholder="e.g. 123456/78/1"
                className="h-[48px] rounded-lg border-[1.5px] border-[#D1D5DB] text-sm focus:border-[#2D9B4E] focus:ring-[#2D9B4E]/15"
              />
            </FormField>
            <FormField label="Birth Certificate No.">
              <Input
                value={personal.birthCertNumber}
                onChange={(e) => setPersonal({ ...personal, birthCertNumber: e.target.value })}
                placeholder="Optional"
                className="h-[48px] rounded-lg border-[1.5px] border-[#D1D5DB] text-sm focus:border-[#2D9B4E] focus:ring-[#2D9B4E]/15"
              />
            </FormField>
            <FormField label="Nationality" required error={errors.nationality}>
              <Input
                value={personal.nationality}
                onChange={(e) => setPersonal({ ...personal, nationality: e.target.value })}
                className="h-[48px] rounded-lg border-[1.5px] border-[#D1D5DB] text-sm focus:border-[#2D9B4E] focus:ring-[#2D9B4E]/15"
              />
            </FormField>
            <FormField label="Home Language">
              <Input
                value={personal.homeLanguage}
                onChange={(e) => setPersonal({ ...personal, homeLanguage: e.target.value })}
                placeholder="e.g. Bemba"
                className="h-[48px] rounded-lg border-[1.5px] border-[#D1D5DB] text-sm focus:border-[#2D9B4E] focus:ring-[#2D9B4E]/15"
              />
            </FormField>
            <FormField label="Religion">
              <Input
                value={personal.religion}
                onChange={(e) => setPersonal({ ...personal, religion: e.target.value })}
                placeholder="Optional"
                className="h-[48px] rounded-lg border-[1.5px] border-[#D1D5DB] text-sm focus:border-[#2D9B4E] focus:ring-[#2D9B4E]/15"
              />
            </FormField>
            <FormField label="Blood Group">
              <Select
                value={personal.bloodGroup}
                onValueChange={(val) => val && setPersonal({ ...personal, bloodGroup: val })}
              >
                <SelectTrigger className="h-[48px] rounded-lg border-[1.5px] border-[#D1D5DB] text-sm">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A+">A+</SelectItem>
                  <SelectItem value="A-">A-</SelectItem>
                  <SelectItem value="B+">B+</SelectItem>
                  <SelectItem value="B-">B-</SelectItem>
                  <SelectItem value="AB+">AB+</SelectItem>
                  <SelectItem value="AB-">AB-</SelectItem>
                  <SelectItem value="O+">O+</SelectItem>
                  <SelectItem value="O-">O-</SelectItem>
                </SelectContent>
              </Select>
            </FormField>
          </div>
        </Card>
      )}

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* Step 2: Academic Placement */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {step === 1 && (
        <Card className="space-y-6 border-none p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="font-heading text-lg font-semibold text-[#111827]">
            Academic Placement
          </h2>

          {activeYear && (
            <div className="rounded-lg bg-[#E8F5ED] px-4 py-3 text-sm text-[#2D9B4E]">
              <span className="font-semibold">Academic Year:</span> {activeYear.label}
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <FormField label="Grade" required error={errors.gradeId}>
              <Select
                value={academic.gradeId}
                onValueChange={(val) => {
                  if (val) setAcademic({ ...academic, gradeId: val, sectionId: '' });
                }}
              >
                <SelectTrigger className="h-[48px] rounded-lg border-[1.5px] border-[#D1D5DB] text-sm">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {grades.map((g) => (
                    <SelectItem key={g._id} value={g._id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Section" required error={errors.sectionId}>
              <Select
                value={academic.sectionId}
                onValueChange={(val) => val && setAcademic({ ...academic, sectionId: val })}
                disabled={!academic.gradeId}
              >
                <SelectTrigger className="h-[48px] rounded-lg border-[1.5px] border-[#D1D5DB] text-sm">
                  <SelectValue
                    placeholder={academic.gradeId ? 'Select section' : 'Select a grade first'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {(sections ?? []).map((s: any) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.displayName}
                      {s.capacity != null && (
                        <span className="ml-2 text-[12px] text-gray-400">
                          (cap: {s.capacity})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                  {sections !== undefined && sections.length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-400">
                      No sections for this grade
                    </div>
                  )}
                </SelectContent>
              </Select>
            </FormField>

            <FormField label="Admission Date" required error={errors.admissionDate}>
              <Input
                type="date"
                value={academic.admissionDate}
                onChange={(e) => setAcademic({ ...academic, admissionDate: e.target.value })}
                className="h-[48px] rounded-lg border-[1.5px] border-[#D1D5DB] text-sm focus:border-[#2D9B4E] focus:ring-[#2D9B4E]/15"
              />
            </FormField>

            <FormField label="Previous School" hint="If transferring from another school">
              <Input
                value={academic.previousSchool}
                onChange={(e) => setAcademic({ ...academic, previousSchool: e.target.value })}
                placeholder="Optional"
                className="h-[48px] rounded-lg border-[1.5px] border-[#D1D5DB] text-sm focus:border-[#2D9B4E] focus:ring-[#2D9B4E]/15"
              />
            </FormField>

            <FormField label="Boarding Status" required>
              <Select
                value={academic.boardingStatus}
                onValueChange={(val) => val && setAcademic({ ...academic, boardingStatus: val })}
              >
                <SelectTrigger className="h-[48px] rounded-lg border-[1.5px] border-[#D1D5DB] text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Day Scholar</SelectItem>
                  <SelectItem value="boarding">Boarding</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            {academic.boardingStatus === 'boarding' && (
              <FormField label="Meal Plan">
                <Select
                  value={academic.mealPlanType}
                  onValueChange={(val) => val && setAcademic({ ...academic, mealPlanType: val })}
                >
                  <SelectTrigger className="h-[48px] rounded-lg border-[1.5px] border-[#D1D5DB] text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_board">Full Board</SelectItem>
                    <SelectItem value="half_board">Half Board</SelectItem>
                    <SelectItem value="none">None</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            )}
          </div>
        </Card>
      )}

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* Step 3: Guardian Information */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-6">
          {/* Guardian search */}
          <Card className="space-y-4 border-none p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="font-heading text-lg font-semibold text-[#111827]">
              Find Existing Guardian
            </h2>
            <p className="text-sm text-[#6B7280]">
              Search by phone number to link an existing guardian.
            </p>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                <Input
                  placeholder="Enter guardian phone number..."
                  value={guardianSearchPhone}
                  onChange={(e) => setGuardianSearchPhone(e.target.value)}
                  className="h-[48px] rounded-lg border-[1.5px] border-[#D1D5DB] pl-10 text-sm focus:border-[#2D9B4E] focus:ring-[#2D9B4E]/15"
                />
              </div>
            </div>
            {guardianSearchResult && (
              <div className="flex items-center justify-between rounded-lg bg-[#E8F5ED] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[#111827]">
                    {guardianSearchResult.firstName} {guardianSearchResult.lastName}
                  </p>
                  <p className="text-[12px] text-[#6B7280]">
                    {guardianSearchResult.phone}
                    {guardianSearchResult.linkedStudents.length > 0 && (
                      <span>
                        {' '}
                        · Guardian of{' '}
                        {guardianSearchResult.linkedStudents
                          .map((s) => `${s.firstName} ${s.lastName}`)
                          .join(', ')}
                      </span>
                    )}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={fillGuardianFromSearch}
                  className="bg-[#2D9B4E] font-semibold hover:bg-[#217A3C]"
                >
                  Use This Guardian
                </Button>
              </div>
            )}
            {guardianSearchPhone.length >= 4 && guardianSearchResult === null && (
              <p className="text-sm text-[#9CA3AF]">
                No guardian found with this phone number. Fill in the details below.
              </p>
            )}
          </Card>

          {/* Primary Guardian */}
          <Card className="space-y-5 border-none p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="font-heading text-lg font-semibold text-[#111827]">
              Primary Guardian
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField label="First Name" required error={errors['guardian.firstName']}>
                <Input
                  value={primaryGuardian.firstName}
                  onChange={(e) =>
                    setPrimaryGuardian({ ...primaryGuardian, firstName: e.target.value })
                  }
                  className="h-[48px] rounded-lg border-[1.5px] border-[#D1D5DB] text-sm focus:border-[#2D9B4E] focus:ring-[#2D9B4E]/15"
                />
              </FormField>
              <FormField label="Last Name" required error={errors['guardian.lastName']}>
                <Input
                  value={primaryGuardian.lastName}
                  onChange={(e) =>
                    setPrimaryGuardian({ ...primaryGuardian, lastName: e.target.value })
                  }
                  className="h-[48px] rounded-lg border-[1.5px] border-[#D1D5DB] text-sm focus:border-[#2D9B4E] focus:ring-[#2D9B4E]/15"
                />
              </FormField>
              <FormField label="Phone Number" required error={errors['guardian.phone']}>
                <Input
                  value={primaryGuardian.phone}
                  onChange={(e) =>
                    setPrimaryGuardian({ ...primaryGuardian, phone: e.target.value })
                  }
                  placeholder="e.g. +260971234567"
                  className="h-[48px] rounded-lg border-[1.5px] border-[#D1D5DB] text-sm focus:border-[#2D9B4E] focus:ring-[#2D9B4E]/15"
                />
              </FormField>
              <FormField label="Alt. Phone">
                <Input
                  value={primaryGuardian.altPhone}
                  onChange={(e) =>
                    setPrimaryGuardian({ ...primaryGuardian, altPhone: e.target.value })
                  }
                  className="h-[48px] rounded-lg border-[1.5px] border-[#D1D5DB] text-sm focus:border-[#2D9B4E] focus:ring-[#2D9B4E]/15"
                />
              </FormField>
              <FormField label="Email">
                <Input
                  type="email"
                  value={primaryGuardian.email}
                  onChange={(e) =>
                    setPrimaryGuardian({ ...primaryGuardian, email: e.target.value })
                  }
                  className="h-[48px] rounded-lg border-[1.5px] border-[#D1D5DB] text-sm focus:border-[#2D9B4E] focus:ring-[#2D9B4E]/15"
                />
              </FormField>
              <FormField label="NRC Number">
                <Input
                  value={primaryGuardian.nrc}
                  onChange={(e) =>
                    setPrimaryGuardian({ ...primaryGuardian, nrc: e.target.value })
                  }
                  className="h-[48px] rounded-lg border-[1.5px] border-[#D1D5DB] text-sm focus:border-[#2D9B4E] focus:ring-[#2D9B4E]/15"
                />
              </FormField>
              <FormField label="Relation" required error={errors['guardian.relation']}>
                <Select
                  value={primaryGuardian.relation}
                  onValueChange={(val) =>
                    val && setPrimaryGuardian({ ...primaryGuardian, relation: val })
                  }
                >
                  <SelectTrigger className="h-[48px] rounded-lg border-[1.5px] border-[#D1D5DB] text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="parent">Parent</SelectItem>
                    <SelectItem value="father">Father</SelectItem>
                    <SelectItem value="mother">Mother</SelectItem>
                    <SelectItem value="guardian">Guardian</SelectItem>
                    <SelectItem value="grandparent">Grandparent</SelectItem>
                    <SelectItem value="uncle">Uncle</SelectItem>
                    <SelectItem value="aunt">Aunt</SelectItem>
                    <SelectItem value="sibling">Sibling</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </FormField>
            </div>

            {/* Permissions */}
            <div className="space-y-3 pt-2">
              <p className="text-[13px] font-medium text-[#374151]">Guardian Permissions</p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {[
                  { key: 'canPayFees', label: 'Can pay school fees' },
                  { key: 'canSeeResults', label: 'Can view exam results' },
                  { key: 'canSeeAttendance', label: 'Can view attendance' },
                  { key: 'receiveSMS', label: 'Receive SMS notifications' },
                  { key: 'isEmergencyContact', label: 'Emergency contact' },
                ].map(({ key, label: permLabel }) => (
                  <Label
                    key={key}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-gray-100 px-3 py-2.5 font-normal transition-colors hover:bg-gray-50"
                  >
                    <Checkbox
                      checked={(primaryGuardian as any)[key]}
                      onCheckedChange={(checked) =>
                        setPrimaryGuardian({ ...primaryGuardian, [key]: !!checked })
                      }
                    />
                    <span className="text-[13px] text-[#374151]">{permLabel}</span>
                  </Label>
                ))}
              </div>
            </div>
          </Card>

          {/* Second Guardian Toggle */}
          <div className="flex items-center gap-3">
            <Checkbox
              checked={hasSecondGuardian}
              onCheckedChange={(checked) => setHasSecondGuardian(!!checked)}
            />
            <span className="text-[14px] font-medium text-[#374151]">
              Add a second guardian
            </span>
          </div>

          {/* Second Guardian */}
          {hasSecondGuardian && (
            <Card className="space-y-5 border-none p-6 shadow-sm ring-1 ring-gray-100">
              <h2 className="font-heading text-lg font-semibold text-[#111827]">
                Second Guardian
              </h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <FormField label="First Name" required>
                  <Input
                    value={secondGuardian.firstName}
                    onChange={(e) =>
                      setSecondGuardian({ ...secondGuardian, firstName: e.target.value })
                    }
                    className="h-[48px] rounded-lg border-[1.5px] border-[#D1D5DB] text-sm focus:border-[#2D9B4E] focus:ring-[#2D9B4E]/15"
                  />
                </FormField>
                <FormField label="Last Name" required>
                  <Input
                    value={secondGuardian.lastName}
                    onChange={(e) =>
                      setSecondGuardian({ ...secondGuardian, lastName: e.target.value })
                    }
                    className="h-[48px] rounded-lg border-[1.5px] border-[#D1D5DB] text-sm focus:border-[#2D9B4E] focus:ring-[#2D9B4E]/15"
                  />
                </FormField>
                <FormField label="Phone Number" required>
                  <Input
                    value={secondGuardian.phone}
                    onChange={(e) =>
                      setSecondGuardian({ ...secondGuardian, phone: e.target.value })
                    }
                    className="h-[48px] rounded-lg border-[1.5px] border-[#D1D5DB] text-sm focus:border-[#2D9B4E] focus:ring-[#2D9B4E]/15"
                  />
                </FormField>
                <FormField label="Relation" required>
                  <Select
                    value={secondGuardian.relation}
                    onValueChange={(val) =>
                      val && setSecondGuardian({ ...secondGuardian, relation: val })
                    }
                  >
                    <SelectTrigger className="h-[48px] rounded-lg border-[1.5px] border-[#D1D5DB] text-sm">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Parent</SelectItem>
                      <SelectItem value="father">Father</SelectItem>
                      <SelectItem value="mother">Mother</SelectItem>
                      <SelectItem value="guardian">Guardian</SelectItem>
                      <SelectItem value="grandparent">Grandparent</SelectItem>
                      <SelectItem value="uncle">Uncle</SelectItem>
                      <SelectItem value="aunt">Aunt</SelectItem>
                      <SelectItem value="sibling">Sibling</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </FormField>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────── */}
      {/* Step 4: Review & Submit */}
      {/* ──────────────────────────────────────────────────────────────────── */}
      {step === 3 && (
        <div className="space-y-6">
          {/* Personal Summary */}
          <Card className="space-y-4 border-none p-6 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-[#111827]">
                Personal Information
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setStep(0)} className="text-[#2D9B4E]">
                Edit
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
              <ReviewItem label="Full Name" value={`${personal.firstName} ${personal.middleName ? personal.middleName + ' ' : ''}${personal.lastName}`} />
              <ReviewItem label="Date of Birth" value={personal.dateOfBirth} />
              <ReviewItem label="Gender" value={personal.gender === 'M' ? 'Male' : 'Female'} />
              <ReviewItem label="Nationality" value={personal.nationality} />
              {personal.nrc && <ReviewItem label="NRC" value={personal.nrc} />}
              {personal.homeLanguage && <ReviewItem label="Home Language" value={personal.homeLanguage} />}
              {personal.bloodGroup && <ReviewItem label="Blood Group" value={personal.bloodGroup} />}
            </div>
          </Card>

          {/* Academic Summary */}
          <Card className="space-y-4 border-none p-6 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-[#111827]">
                Academic Placement
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setStep(1)} className="text-[#2D9B4E]">
                Edit
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
              <ReviewItem label="Grade" value={selectedGrade?.name ?? '—'} />
              <ReviewItem label="Section" value={(selectedSection as any)?.displayName ?? '—'} />
              <ReviewItem label="Admission Date" value={academic.admissionDate} />
              <ReviewItem label="Boarding" value={academic.boardingStatus === 'boarding' ? 'Boarding' : 'Day Scholar'} />
              {academic.previousSchool && <ReviewItem label="Previous School" value={academic.previousSchool} />}
            </div>
          </Card>

          {/* Guardian Summary */}
          <Card className="space-y-4 border-none p-6 shadow-sm ring-1 ring-gray-100">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-lg font-semibold text-[#111827]">
                Guardian Information
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setStep(2)} className="text-[#2D9B4E]">
                Edit
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
              <ReviewItem label="Name" value={`${primaryGuardian.firstName} ${primaryGuardian.lastName}`} />
              <ReviewItem label="Phone" value={primaryGuardian.phone} />
              <ReviewItem label="Relation" value={primaryGuardian.relation} />
              {primaryGuardian.email && <ReviewItem label="Email" value={primaryGuardian.email} />}
            </div>
            {hasSecondGuardian && (
              <>
                <div className="border-t border-[#F3F4F6] pt-3" />
                <p className="text-[13px] font-medium text-[#6B7280]">Second Guardian</p>
                <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-3">
                  <ReviewItem label="Name" value={`${secondGuardian.firstName} ${secondGuardian.lastName}`} />
                  <ReviewItem label="Phone" value={secondGuardian.phone} />
                  <ReviewItem label="Relation" value={secondGuardian.relation} />
                </div>
              </>
            )}
          </Card>

          {/* Health Summary */}
          <Card className="space-y-4 border-none p-6 shadow-sm ring-1 ring-gray-100">
            <h2 className="font-heading text-lg font-semibold text-[#111827]">
              Health & Additional
            </h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <FormField label="Medical Conditions">
                <Textarea
                  value={health.medicalConditions}
                  onChange={(e) => setHealth({ ...health, medicalConditions: e.target.value })}
                  placeholder="Any known conditions..."
                  rows={2}
                  className="rounded-lg border-[1.5px] border-[#D1D5DB] text-sm focus:border-[#2D9B4E] focus:ring-[#2D9B4E]/15"
                />
              </FormField>
              <FormField label="Allergies">
                <Textarea
                  value={health.allergies}
                  onChange={(e) => setHealth({ ...health, allergies: e.target.value })}
                  placeholder="Food, medication, or environmental allergies..."
                  rows={2}
                  className="rounded-lg border-[1.5px] border-[#D1D5DB] text-sm focus:border-[#2D9B4E] focus:ring-[#2D9B4E]/15"
                />
              </FormField>
              <FormField label="Current Medications">
                <Textarea
                  value={health.medications}
                  onChange={(e) => setHealth({ ...health, medications: e.target.value })}
                  placeholder="Any regular medications..."
                  rows={2}
                  className="rounded-lg border-[1.5px] border-[#D1D5DB] text-sm focus:border-[#2D9B4E] focus:ring-[#2D9B4E]/15"
                />
              </FormField>
              <FormField label="Special Needs">
                <Textarea
                  value={health.specialNeeds}
                  onChange={(e) => setHealth({ ...health, specialNeeds: e.target.value })}
                  placeholder="Any special requirements..."
                  rows={2}
                  className="rounded-lg border-[1.5px] border-[#D1D5DB] text-sm focus:border-[#2D9B4E] focus:ring-[#2D9B4E]/15"
                />
              </FormField>
              <FormField label="Doctor's Name">
                <Input
                  value={health.doctorName}
                  onChange={(e) => setHealth({ ...health, doctorName: e.target.value })}
                  className="h-[48px] rounded-lg border-[1.5px] border-[#D1D5DB] text-sm focus:border-[#2D9B4E] focus:ring-[#2D9B4E]/15"
                />
              </FormField>
              <FormField label="Doctor's Phone">
                <Input
                  value={health.doctorPhone}
                  onChange={(e) => setHealth({ ...health, doctorPhone: e.target.value })}
                  className="h-[48px] rounded-lg border-[1.5px] border-[#D1D5DB] text-sm focus:border-[#2D9B4E] focus:ring-[#2D9B4E]/15"
                />
              </FormField>
            </div>
          </Card>
        </div>
      )}

      {/* ── Navigation Buttons ── */}
      <div className="flex items-center justify-between pt-2">
        <div>
          {step > 0 && (
            <Button
              variant="outline"
              onClick={goBack}
              className="h-11 gap-2 rounded-lg border-gray-200 px-5 text-sm font-medium"
            >
              <ChevronLeft className="h-4 w-4" />
              Back
            </Button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link href="/students">
            <Button variant="ghost" className="h-11 px-5 text-sm font-medium text-[#6B7280]">
              Cancel
            </Button>
          </Link>
          {step < 3 ? (
            <Button
              onClick={goNext}
              className="h-11 gap-2 bg-[#2D9B4E] px-6 font-semibold shadow-sm hover:bg-[#217A3C]"
            >
              Continue
              <ChevronRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="h-11 gap-2 bg-[#2D9B4E] px-6 font-semibold shadow-sm hover:bg-[#217A3C]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enrolling...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Enrol Student
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Review helper ───────────────────────────────────────────────────────────

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] font-medium text-[#9CA3AF]">{label}</p>
      <p className="text-[14px] text-[#111827]">{value || '—'}</p>
    </div>
  );
}
