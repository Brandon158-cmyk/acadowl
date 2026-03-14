'use client';

import { useState } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../../../convex/_generated/api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
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
  Loader2,
  UserPlus,
  Users,
  Briefcase,
  Phone,
  Mail,
  Calendar,
  Shield,
  CreditCard,
  MapPin,
} from 'lucide-react';

// ── Role → Staff Category mapping ──

const ROLE_CATEGORY_MAP: Record<string, string> = {
  school_admin: 'admin',
  deputy_head: 'admin',
  bursar: 'non_teaching',
  teacher: 'teaching',
  class_teacher: 'teaching',
  matron: 'non_teaching',
  librarian: 'non_teaching',
  driver: 'non_teaching',
};

const ROLE_LABELS: Record<string, string> = {
  school_admin: 'School Admin',
  deputy_head: 'Deputy Head',
  bursar: 'Bursar',
  teacher: 'Teacher',
  class_teacher: 'Class Teacher',
  matron: 'Matron',
  librarian: 'Librarian',
  driver: 'Driver',
};

export default function AddStaffPage() {
  const router = useRouter();
  const createUserAndStaff = useMutation(api.staff.mutations.createUserAndStaff);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    middleName: '',
    gender: '' as '' | 'M' | 'F',
    dateOfBirth: '',
    nrc: '',
    phone: '',
    altPhone: '',
    email: '',
    address: '',
    role: '' as string,
    staffCategory: '' as '' | 'teaching' | 'non_teaching' | 'admin',
    jobTitle: '',
    tcazNumber: '',
    employeeNumber: '',
    contractType: '' as '' | 'permanent' | 'contract' | 'volunteer' | 'intern',
    dateJoined: new Date().toISOString().split('T')[0],
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    bankName: '',
    bankAccountNumber: '',
    napsaNumber: '',
    nhimaNumber: '',
  });

  const updateField = (field: string, value: string) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value };
      // Auto-set staffCategory when role changes
      if (field === 'role' && ROLE_CATEGORY_MAP[value]) {
        next.staffCategory = ROLE_CATEGORY_MAP[value] as any;
      }
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!form.firstName.trim() || !form.lastName.trim()) {
      toast.error('First name and last name are required.');
      return;
    }
    if (!form.gender) {
      toast.error('Please select a gender.');
      return;
    }
    if (!form.role) {
      toast.error('Please select a role.');
      return;
    }
    if (!form.staffCategory) {
      toast.error('Please select a staff category.');
      return;
    }
    if (!form.jobTitle.trim()) {
      toast.error('Job title is required.');
      return;
    }
    if (!form.contractType) {
      toast.error('Please select a contract type.');
      return;
    }
    if (!form.phone.trim() && !form.email.trim()) {
      toast.error('Please provide at least a phone number or email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const emergencyContact =
        form.emergencyContactName.trim() && form.emergencyContactPhone.trim()
          ? {
              name: form.emergencyContactName.trim(),
              phone: form.emergencyContactPhone.trim(),
              relation: form.emergencyContactRelation.trim() || 'Other',
            }
          : undefined;

      const result = await createUserAndStaff({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        middleName: form.middleName.trim() || undefined,
        gender: form.gender as 'M' | 'F',
        dateOfBirth: form.dateOfBirth || undefined,
        nrc: form.nrc.trim() || undefined,
        phone: form.phone.trim() || undefined,
        altPhone: form.altPhone.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        role: form.role as any,
        staffCategory: form.staffCategory as any,
        jobTitle: form.jobTitle.trim(),
        tcazNumber: form.tcazNumber.trim() || undefined,
        employeeNumber: form.employeeNumber.trim() || undefined,
        contractType: form.contractType as any,
        dateJoined: form.dateJoined,
        emergencyContact,
        bankName: form.bankName.trim() || undefined,
        bankAccountNumber: form.bankAccountNumber.trim() || undefined,
        napsaNumber: form.napsaNumber.trim() || undefined,
        nhimaNumber: form.nhimaNumber.trim() || undefined,
      });

      toast.success(`${form.firstName} ${form.lastName} has been added as staff.`);
      router.push(`/staff/${result.staffId}`);
    } catch (error: any) {
      toast.error(error.data ?? 'Failed to create staff member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8 pb-10">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm font-medium text-[#2D9B4E]">
        <Link href="/staff" className="hover:underline">
          Staff
        </Link>
        <ChevronRight className="text-muted-foreground/50 h-3.5 w-3.5" />
        <span className="text-muted-foreground font-semibold">Add Staff Member</span>
      </div>

      {/* Page Title */}
      <div>
        <h1 className="font-heading text-3xl font-bold tracking-tight text-[#111827]">
          Add Staff Member
        </h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Create a user account and staff profile in one step. The new staff member will be able to
          log in with their phone number or email.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information */}
        <Card className="border-none p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="font-heading mb-6 flex items-center gap-2 text-lg font-semibold text-[#111827]">
            <Users className="h-5 w-5 text-[#2D9B4E]" />
            Personal Information
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">
                First Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                className="h-10"
                placeholder="e.g. John"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                className="h-10"
                placeholder="e.g. Phiri"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Middle Name</Label>
              <Input
                value={form.middleName}
                onChange={(e) => updateField('middleName', e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">
                Gender <span className="text-red-500">*</span>
              </Label>
              <Select value={form.gender} onValueChange={(v) => v && updateField('gender', v)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="M">Male</SelectItem>
                  <SelectItem value="F">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Date of Birth</Label>
              <Input
                type="date"
                value={form.dateOfBirth}
                onChange={(e) => updateField('dateOfBirth', e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <CreditCard className="h-3.5 w-3.5" />
                NRC Number
              </Label>
              <Input
                value={form.nrc}
                onChange={(e) => updateField('nrc', e.target.value)}
                className="h-10"
                placeholder="e.g. 123456/78/9"
              />
            </div>
          </div>
        </Card>

        {/* Contact Details */}
        <Card className="border-none p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="font-heading mb-6 flex items-center gap-2 text-lg font-semibold text-[#111827]">
            <Phone className="h-5 w-5 text-[#2D9B4E]" />
            Contact Details
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">
                Phone Number
              </Label>
              <Input
                value={form.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="h-10"
                placeholder="e.g. 0971234567"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Alternative Phone</Label>
              <Input
                value={form.altPhone}
                onChange={(e) => updateField('altPhone', e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => updateField('email', e.target.value)}
                className="h-10"
                placeholder="e.g. john.phiri@school.edu.zm"
              />
            </div>
            <p className="col-span-full text-xs text-gray-400">
              At least one of Phone or Email is required.
            </p>
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                <MapPin className="h-3.5 w-3.5" />
                Address
              </Label>
              <Input
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                className="h-10"
                placeholder="Physical address"
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <h3 className="font-heading mt-8 mb-4 text-base font-semibold text-[#111827]">
            Emergency Contact
          </h3>
          <div className="grid gap-5 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Name</Label>
              <Input
                value={form.emergencyContactName}
                onChange={(e) => updateField('emergencyContactName', e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Phone</Label>
              <Input
                value={form.emergencyContactPhone}
                onChange={(e) => updateField('emergencyContactPhone', e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Relation</Label>
              <Input
                value={form.emergencyContactRelation}
                onChange={(e) => updateField('emergencyContactRelation', e.target.value)}
                className="h-10"
                placeholder="e.g. Spouse, Parent"
              />
            </div>
          </div>
        </Card>

        {/* Professional Details */}
        <Card className="border-none p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="font-heading mb-6 flex items-center gap-2 text-lg font-semibold text-[#111827]">
            <Briefcase className="h-5 w-5 text-[#2D9B4E]" />
            Professional Details
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">
                System Role <span className="text-red-500">*</span>
              </Label>
              <Select value={form.role} onValueChange={(v) => v && updateField('role', v)}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[11px] text-gray-400">
                Determines what the staff member can see and do in the system.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">
                Staff Category <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.staffCategory}
                onValueChange={(v) => v && updateField('staffCategory', v)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="teaching">Teaching</SelectItem>
                  <SelectItem value="non_teaching">Non-Teaching</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">
                Job Title <span className="text-red-500">*</span>
              </Label>
              <Input
                value={form.jobTitle}
                onChange={(e) => updateField('jobTitle', e.target.value)}
                className="h-10"
                placeholder="e.g. Mathematics Teacher"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">
                Contract Type <span className="text-red-500">*</span>
              </Label>
              <Select
                value={form.contractType}
                onValueChange={(v) => v && updateField('contractType', v)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="Select contract type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="permanent">Permanent</SelectItem>
                  <SelectItem value="contract">Contract</SelectItem>
                  <SelectItem value="volunteer">Volunteer</SelectItem>
                  <SelectItem value="intern">Intern</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">
                Date Joined <span className="text-red-500">*</span>
              </Label>
              <Input
                type="date"
                value={form.dateJoined}
                onChange={(e) => updateField('dateJoined', e.target.value)}
                className="h-10"
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Employee Number</Label>
              <Input
                value={form.employeeNumber}
                onChange={(e) => updateField('employeeNumber', e.target.value)}
                className="h-10"
                placeholder="Internal employee ID"
              />
            </div>
            {(form.staffCategory === 'teaching' || form.role === 'teacher' || form.role === 'class_teacher') && (
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                  <Shield className="h-3.5 w-3.5" />
                  TCAZ Number
                </Label>
                <Input
                  value={form.tcazNumber}
                  onChange={(e) => updateField('tcazNumber', e.target.value)}
                  className="h-10"
                  placeholder="Teaching Council of Zambia"
                />
              </div>
            )}
          </div>
        </Card>

        {/* Banking / Payroll */}
        <Card className="border-none p-6 shadow-sm ring-1 ring-gray-100">
          <h2 className="font-heading mb-2 flex items-center gap-2 text-lg font-semibold text-[#111827]">
            <CreditCard className="h-5 w-5 text-[#2D9B4E]" />
            Payroll & Banking
          </h2>
          <p className="mb-6 text-sm text-gray-500">
            Optional — can be added later from the staff profile.
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Bank Name</Label>
              <Input
                value={form.bankName}
                onChange={(e) => updateField('bankName', e.target.value)}
                className="h-10"
                placeholder="e.g. Zanaco, FNB, Stanbic"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">Account Number</Label>
              <Input
                value={form.bankAccountNumber}
                onChange={(e) => updateField('bankAccountNumber', e.target.value)}
                className="h-10"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">NAPSA Number</Label>
              <Input
                value={form.napsaNumber}
                onChange={(e) => updateField('napsaNumber', e.target.value)}
                className="h-10"
                placeholder="National Pension Scheme Authority"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-gray-500">NHIMA Number</Label>
              <Input
                value={form.nhimaNumber}
                onChange={(e) => updateField('nhimaNumber', e.target.value)}
                className="h-10"
                placeholder="National Health Insurance"
              />
            </div>
          </div>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link href="/staff">
            <Button type="button" variant="outline" className="h-10">
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            className="h-10 gap-2 bg-[#2D9B4E] px-8 font-semibold hover:bg-[#217A3C]"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {isSubmitting ? 'Creating...' : 'Add Staff Member'}
          </Button>
        </div>
      </form>
    </div>
  );
}
