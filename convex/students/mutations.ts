import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { requirePermission } from '../_lib/permissions';
import { getAuthenticatedUserAndSchool } from '../_lib/schoolContext';
import { Permission } from '../../src/lib/roles/types';
import { EduError, throwEduError } from '../_lib/errors';
import { Id } from '../_generated/dataModel';
import { MutationCtx } from '../_generated/server';

// ── ISSUE-048 · Student Enrolment Form ──────────────────────────────────────

/**
 * Generate a unique student number for a school.
 * Format: {schoolPrefix}-{2-digit-year}-{4-digit-sequence}
 * e.g., KBS-25-0001
 */
async function generateStudentNumber(
  ctx: MutationCtx,
  schoolId: Id<'schools'>,
  schoolShortName: string | undefined,
  year: number,
): Promise<string> {
  const prefix = (schoolShortName || 'SCH').substring(0, 3).toUpperCase();
  const yearSuffix = String(year).slice(-2);
  const counterKey = `student_number_${year}`;

  // Find or create the counter
  const existing = await ctx.db
    .query('counters')
    .withIndex('by_school_key', (q) => q.eq('schoolId', schoolId).eq('key', counterKey))
    .unique();

  let nextValue: number;
  if (existing) {
    nextValue = existing.value + 1;
    await ctx.db.patch(existing._id, { value: nextValue });
  } else {
    nextValue = 1;
    await ctx.db.insert('counters', {
      schoolId,
      key: counterKey,
      value: nextValue,
    });
  }

  const sequence = String(nextValue).padStart(4, '0');
  return `${prefix}-${yearSuffix}-${sequence}`;
}

/**
 * Enrol a new student into the system.
 * Creates the student record with initial section placement.
 */
export const enrolStudent = mutation({
  args: {
    // Personal
    firstName: v.string(),
    lastName: v.string(),
    middleName: v.optional(v.string()),
    preferredName: v.optional(v.string()),
    dateOfBirth: v.string(),
    gender: v.union(v.literal('M'), v.literal('F')),
    nrc: v.optional(v.string()),
    birthCertNumber: v.optional(v.string()),
    nationality: v.string(),
    homeLanguage: v.optional(v.string()),
    religion: v.optional(v.string()),
    photoStorageId: v.optional(v.id('_storage')),

    // Academic placement
    currentSectionId: v.id('sections'),
    currentGradeId: v.id('grades'),
    admissionDate: v.string(),
    previousSchool: v.optional(v.string()),

    // Boarding
    boardingStatus: v.union(v.literal('day'), v.literal('boarding')),
    mealPlanType: v.optional(
      v.union(v.literal('full_board'), v.literal('half_board'), v.literal('none')),
    ),

    // Health
    bloodGroup: v.optional(v.string()),
    medicalConditions: v.optional(v.string()),
    medications: v.optional(v.string()),
    allergies: v.optional(v.string()),
    specialNeeds: v.optional(v.string()),
    doctorName: v.optional(v.string()),
    doctorPhone: v.optional(v.string()),

    // Guardian — inline for the primary guardian
    guardian: v.optional(
      v.object({
        firstName: v.string(),
        lastName: v.string(),
        phone: v.string(),
        altPhone: v.optional(v.string()),
        email: v.optional(v.string()),
        nrc: v.optional(v.string()),
        relation: v.string(),
        canPayFees: v.boolean(),
        canSeeResults: v.boolean(),
        canSeeAttendance: v.boolean(),
        receiveSMS: v.boolean(),
        isEmergencyContact: v.boolean(),
      }),
    ),

    // Second guardian
    secondGuardian: v.optional(
      v.object({
        firstName: v.string(),
        lastName: v.string(),
        phone: v.string(),
        altPhone: v.optional(v.string()),
        email: v.optional(v.string()),
        nrc: v.optional(v.string()),
        relation: v.string(),
        canPayFees: v.boolean(),
        canSeeResults: v.boolean(),
        canSeeAttendance: v.boolean(),
        receiveSMS: v.boolean(),
        isEmergencyContact: v.boolean(),
      }),
    ),

    // Custom fields
    customFieldValues: v.optional(
      v.record(v.string(), v.union(v.string(), v.number(), v.boolean(), v.null())),
    ),

    // Optional explicit student number
    studentNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user, school } = await requirePermission(ctx, Permission.ENROL_STUDENT);

    // Validate the section belongs to this school
    const section = await ctx.db.get(args.currentSectionId);
    if (!section || section.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Section not found or does not belong to your school.');
    }

    // Validate the grade belongs to this school
    const grade = await ctx.db.get(args.currentGradeId);
    if (!grade || grade.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Grade not found or does not belong to your school.');
    }

    // Validate the section belongs to the grade
    if (section.gradeId !== args.currentGradeId) {
      throwEduError(
        EduError.VALIDATION_ERROR,
        'The selected section does not belong to the selected grade.',
      );
    }

    // Validate DOB — student must be at least 3 years old
    const dob = new Date(args.dateOfBirth);
    const now = new Date();
    const ageDiff = now.getFullYear() - dob.getFullYear();
    const monthDiff = now.getMonth() - dob.getMonth();
    const age = monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())
      ? ageDiff - 1
      : ageDiff;
    if (age < 3) {
      throwEduError(EduError.VALIDATION_ERROR, 'Student must be at least 3 years old.');
    }

    // Must have an active academic year
    if (!school.currentAcademicYearId) {
      throwEduError(
        EduError.VALIDATION_ERROR,
        'No active academic year. Activate an academic year before enrolling students.',
      );
    }

    // Generate or validate student number
    let studentNumber = args.studentNumber;
    if (studentNumber) {
      // Check uniqueness
      const existing = await ctx.db
        .query('students')
        .withIndex('by_student_number', (q) =>
          q.eq('schoolId', school._id).eq('studentNumber', studentNumber!),
        )
        .first();
      if (existing) {
        throwEduError(
          EduError.ALREADY_EXISTS,
          `Student number "${studentNumber}" is already in use.`,
        );
      }
    } else {
      const academicYear = await ctx.db.get(school.currentAcademicYearId);
      studentNumber = await generateStudentNumber(
        ctx,
        school._id,
        school.shortName,
        academicYear!.year,
      );
    }

    // Resolve photo URL from storage
    let photoUrl: string | undefined;
    if (args.photoStorageId) {
      photoUrl = await ctx.storage.getUrl(args.photoStorageId) ?? undefined;
    }

    // Process guardian links
    const guardianLinks: Array<{
      guardianId: Id<'guardians'>;
      isPrimary: boolean;
      relation: string;
      canPayFees: boolean;
      canSeeResults: boolean;
      canSeeAttendance: boolean;
      receiveSMS: boolean;
      canAuthorizeLeave: boolean;
      isEmergencyContact: boolean;
    }> = [];

    if (args.guardian) {
      const guardianId = await findOrCreateGuardian(ctx, school._id, args.guardian);
      guardianLinks.push({
        guardianId,
        isPrimary: true,
        relation: args.guardian.relation,
        canPayFees: args.guardian.canPayFees,
        canSeeResults: args.guardian.canSeeResults,
        canSeeAttendance: args.guardian.canSeeAttendance,
        receiveSMS: args.guardian.receiveSMS,
        canAuthorizeLeave: true,
        isEmergencyContact: args.guardian.isEmergencyContact,
      });
    }

    if (args.secondGuardian) {
      const guardianId = await findOrCreateGuardian(ctx, school._id, args.secondGuardian);
      guardianLinks.push({
        guardianId,
        isPrimary: false,
        relation: args.secondGuardian.relation,
        canPayFees: args.secondGuardian.canPayFees,
        canSeeResults: args.secondGuardian.canSeeResults,
        canSeeAttendance: args.secondGuardian.canSeeAttendance,
        receiveSMS: args.secondGuardian.receiveSMS,
        canAuthorizeLeave: false,
        isEmergencyContact: args.secondGuardian.isEmergencyContact,
      });
    }

    const studentId = await ctx.db.insert('students', {
      schoolId: school._id,
      studentNumber: studentNumber!,
      firstName: args.firstName.trim(),
      lastName: args.lastName.trim(),
      middleName: args.middleName?.trim(),
      preferredName: args.preferredName?.trim(),
      dateOfBirth: args.dateOfBirth,
      gender: args.gender,
      nrc: args.nrc?.trim(),
      birthCertNumber: args.birthCertNumber?.trim(),
      nationality: args.nationality,
      homeLanguage: args.homeLanguage,
      religion: args.religion,
      photoUrl,
      currentSectionId: args.currentSectionId,
      currentGradeId: args.currentGradeId,
      currentAcademicYearId: school.currentAcademicYearId!,
      admissionDate: args.admissionDate,
      admissionGradeId: args.currentGradeId,
      previousSchool: args.previousSchool?.trim(),
      guardianLinks,
      boardingStatus: args.boardingStatus,
      mealPlanType: args.mealPlanType,
      bloodGroup: args.bloodGroup,
      medicalConditions: args.medicalConditions?.trim(),
      medications: args.medications?.trim(),
      allergies: args.allergies?.trim(),
      specialNeeds: args.specialNeeds?.trim(),
      doctorName: args.doctorName?.trim(),
      doctorPhone: args.doctorPhone?.trim(),
      customFieldValues: args.customFieldValues,
      status: 'active',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      createdBy: user._id,
    });

    // ISSUE-056: Create initial sectionHistory record
    await ctx.db.insert('sectionHistory', {
      schoolId: school._id,
      studentId,
      sectionId: args.currentSectionId,
      gradeId: args.currentGradeId,
      academicYearId: school.currentAcademicYearId!,
      fromDate: args.admissionDate,
      reason: 'initial_enrolment',
      changedBy: user._id,
      createdAt: Date.now(),
    });

    return { studentId, studentNumber };
  },
});

/**
 * Internal helper to find or create a guardian by phone within a school.
 * If found, returns existing guardianId. If not, creates both user and guardian records.
 */
async function findOrCreateGuardian(
  ctx: MutationCtx,
  schoolId: Id<'schools'>,
  guardian: {
    firstName: string;
    lastName: string;
    phone: string;
    altPhone?: string;
    email?: string;
    nrc?: string;
    relation: string;
  },
): Promise<Id<'guardians'>> {
  // Search for existing guardian in this school by phone
  const existing = await ctx.db
    .query('guardians')
    .withIndex('by_school_phone', (q) =>
      q.eq('schoolId', schoolId).eq('phone', guardian.phone),
    )
    .first();

  if (existing) return existing._id;

  // Create a user record for the guardian
  const userId = await ctx.db.insert('users', {
    schoolId,
    phone: guardian.phone,
    email: guardian.email,
    name: `${guardian.firstName} ${guardian.lastName}`,
    role: 'guardian',
    isActive: true,
    isFirstLogin: true,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  // Create the guardian profile
  const guardianId = await ctx.db.insert('guardians', {
    schoolId,
    userId,
    firstName: guardian.firstName.trim(),
    lastName: guardian.lastName.trim(),
    phone: guardian.phone.trim(),
    altPhone: guardian.altPhone?.trim(),
    email: guardian.email?.trim(),
    nrc: guardian.nrc?.trim(),
    preferredContactMethod: 'sms',
    receiveAttendanceSMS: true,
    receiveResultsSMS: true,
    receiveFeeReminderSMS: true,
    isVerified: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  });

  // Link user back to guardian
  await ctx.db.patch(userId, { guardianId });

  return guardianId;
}

/**
 * Update a student's information.
 */
export const updateStudent = mutation({
  args: {
    id: v.id('students'),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    middleName: v.optional(v.string()),
    preferredName: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    gender: v.optional(v.union(v.literal('M'), v.literal('F'))),
    nrc: v.optional(v.string()),
    birthCertNumber: v.optional(v.string()),
    nationality: v.optional(v.string()),
    homeLanguage: v.optional(v.string()),
    religion: v.optional(v.string()),
    photoStorageId: v.optional(v.id('_storage')),
    boardingStatus: v.optional(v.union(v.literal('day'), v.literal('boarding'))),
    mealPlanType: v.optional(
      v.union(v.literal('full_board'), v.literal('half_board'), v.literal('none')),
    ),
    bloodGroup: v.optional(v.string()),
    medicalConditions: v.optional(v.string()),
    medications: v.optional(v.string()),
    allergies: v.optional(v.string()),
    specialNeeds: v.optional(v.string()),
    doctorName: v.optional(v.string()),
    doctorPhone: v.optional(v.string()),
    customFieldValues: v.optional(
      v.record(v.string(), v.union(v.string(), v.number(), v.boolean(), v.null())),
    ),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.EDIT_STUDENT);

    const student = await ctx.db.get(args.id);
    if (!student || student.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Student not found.');
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };

    if (args.firstName !== undefined) updates.firstName = args.firstName.trim();
    if (args.lastName !== undefined) updates.lastName = args.lastName.trim();
    if (args.middleName !== undefined) updates.middleName = args.middleName.trim();
    if (args.preferredName !== undefined) updates.preferredName = args.preferredName.trim();
    if (args.dateOfBirth !== undefined) updates.dateOfBirth = args.dateOfBirth;
    if (args.gender !== undefined) updates.gender = args.gender;
    if (args.nrc !== undefined) updates.nrc = args.nrc.trim();
    if (args.birthCertNumber !== undefined) updates.birthCertNumber = args.birthCertNumber.trim();
    if (args.nationality !== undefined) updates.nationality = args.nationality;
    if (args.homeLanguage !== undefined) updates.homeLanguage = args.homeLanguage;
    if (args.religion !== undefined) updates.religion = args.religion;
    if (args.boardingStatus !== undefined) updates.boardingStatus = args.boardingStatus;
    if (args.mealPlanType !== undefined) updates.mealPlanType = args.mealPlanType;
    if (args.bloodGroup !== undefined) updates.bloodGroup = args.bloodGroup;
    if (args.medicalConditions !== undefined) updates.medicalConditions = args.medicalConditions.trim();
    if (args.medications !== undefined) updates.medications = args.medications.trim();
    if (args.allergies !== undefined) updates.allergies = args.allergies.trim();
    if (args.specialNeeds !== undefined) updates.specialNeeds = args.specialNeeds.trim();
    if (args.doctorName !== undefined) updates.doctorName = args.doctorName.trim();
    if (args.doctorPhone !== undefined) updates.doctorPhone = args.doctorPhone.trim();
    if (args.customFieldValues !== undefined) updates.customFieldValues = args.customFieldValues;

    // Handle photo update
    if (args.photoStorageId) {
      const photoUrl = await ctx.storage.getUrl(args.photoStorageId) ?? undefined;
      updates.photoUrl = photoUrl;
    }

    await ctx.db.patch(args.id, updates);
  },
});

/**
 * Change a student's section (within the same grade, same academic year).
 */
export const changeStudentSection = mutation({
  args: {
    studentId: v.id('students'),
    newSectionId: v.id('sections'),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.EDIT_STUDENT);

    const student = await ctx.db.get(args.studentId);
    if (!student || student.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Student not found.');
    }

    const newSection = await ctx.db.get(args.newSectionId);
    if (!newSection || newSection.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Target section not found.');
    }

    // Ensure same grade
    if (newSection.gradeId !== student!.currentGradeId) {
      throwEduError(
        EduError.VALIDATION_ERROR,
        'Cannot transfer to a section in a different grade. Use promotion instead.',
      );
    }

    // Check capacity
    if (newSection.capacity) {
      const enrolled = await ctx.db
        .query('students')
        .withIndex('by_section', (q) => q.eq('currentSectionId', args.newSectionId))
        .filter((q) => q.eq(q.field('status'), 'active'))
        .collect();

      if (enrolled.length >= newSection.capacity) {
        throwEduError(EduError.VALIDATION_ERROR, 'Target section is at full capacity.');
      }
    }

    await ctx.db.patch(args.studentId, {
      currentSectionId: args.newSectionId,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Bulk change sections for multiple students.
 */
export const bulkChangeSection = mutation({
  args: {
    studentIds: v.array(v.id('students')),
    newSectionId: v.id('sections'),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.EDIT_STUDENT);

    const newSection = await ctx.db.get(args.newSectionId);
    if (!newSection || newSection.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Target section not found.');
    }

    let moved = 0;
    for (const studentId of args.studentIds) {
      const student = await ctx.db.get(studentId);
      if (!student || student.schoolId !== school._id) continue;
      if (student.currentGradeId !== newSection.gradeId) continue;

      await ctx.db.patch(studentId, {
        currentSectionId: args.newSectionId,
        updatedAt: Date.now(),
      });
      moved++;
    }

    return { moved, total: args.studentIds.length };
  },
});

/**
 * Generate a Convex storage upload URL for student photos/documents.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await getAuthenticatedUserAndSchool(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

/**
 * Update student status (withdraw).
 */
export const withdrawStudent = mutation({
  args: {
    studentId: v.id('students'),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.EDIT_STUDENT);

    const student = await ctx.db.get(args.studentId);
    if (!student || student.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Student not found.');
    }

    if (student!.status !== 'active') {
      throwEduError(EduError.VALIDATION_ERROR, 'Only active students can be withdrawn.');
    }

    await ctx.db.patch(args.studentId, {
      status: 'withdrawn',
      updatedAt: Date.now(),
    });
  },
});
