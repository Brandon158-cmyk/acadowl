import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { requirePermission } from '../_lib/permissions';
import { Permission } from '../../src/lib/roles/types';
import { EduError, throwEduError } from '../_lib/errors';

// ── Staff CRUD Mutations ──

/**
 * Create a new staff record and link it to an existing user account.
 * Requires CREATE_STAFF permission.
 */
export const createStaff = mutation({
  args: {
    userId: v.id('users'),
    firstName: v.string(),
    lastName: v.string(),
    middleName: v.optional(v.string()),
    gender: v.union(v.literal('M'), v.literal('F')),
    dateOfBirth: v.optional(v.string()),
    nrc: v.optional(v.string()),
    phone: v.string(),
    altPhone: v.optional(v.string()),
    email: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    address: v.optional(v.string()),
    emergencyContact: v.optional(
      v.object({
        name: v.string(),
        phone: v.string(),
        relation: v.string(),
      }),
    ),
    staffCategory: v.union(v.literal('teaching'), v.literal('non_teaching'), v.literal('admin')),
    jobTitle: v.string(),
    tcazNumber: v.optional(v.string()),
    employeeNumber: v.optional(v.string()),
    contractType: v.union(
      v.literal('permanent'),
      v.literal('contract'),
      v.literal('volunteer'),
      v.literal('intern'),
    ),
    dateJoined: v.string(),
    bankName: v.optional(v.string()),
    bankAccountNumber: v.optional(v.string()),
    napsaNumber: v.optional(v.string()),
    nhimaNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.CREATE_STAFF);

    // Validate user belongs to this school
    const user = await ctx.db.get(args.userId);
    if (!user || user.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'User not found or does not belong to your school.');
    }

    // Check user doesn't already have a staff record
    if (user.staffId) {
      throwEduError(EduError.ALREADY_EXISTS, 'This user already has a staff profile.');
    }

    // Check no other staff record linked to this user
    const existingStaff = await ctx.db
      .query('staff')
      .withIndex('by_user', (q) => q.eq('userId', args.userId))
      .first();

    if (existingStaff) {
      throwEduError(EduError.ALREADY_EXISTS, 'A staff record already exists for this user.');
    }

    // Check for duplicate TCAZ number if provided
    if (args.tcazNumber) {
      const existingTcaz = await ctx.db
        .query('staff')
        .withIndex('by_tcaz', (q) => q.eq('tcazNumber', args.tcazNumber!))
        .first();
      if (existingTcaz && existingTcaz.schoolId === school._id) {
        throwEduError(
          EduError.ALREADY_EXISTS,
          'A staff member with this TCAZ number already exists.',
        );
      }
    }

    const now = Date.now();

    const staffId = await ctx.db.insert('staff', {
      schoolId: school._id,
      userId: args.userId,
      firstName: args.firstName,
      lastName: args.lastName,
      middleName: args.middleName,
      gender: args.gender,
      dateOfBirth: args.dateOfBirth,
      nrc: args.nrc,
      phone: args.phone,
      altPhone: args.altPhone,
      email: args.email,
      photoUrl: args.photoUrl,
      address: args.address,
      emergencyContact: args.emergencyContact,
      staffCategory: args.staffCategory,
      jobTitle: args.jobTitle,
      tcazNumber: args.tcazNumber,
      employeeNumber: args.employeeNumber,
      contractType: args.contractType,
      dateJoined: args.dateJoined,
      bankName: args.bankName,
      bankAccountNumber: args.bankAccountNumber,
      napsaNumber: args.napsaNumber,
      nhimaNumber: args.nhimaNumber,
      subjectIds: [],
      sectionIds: [],
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });

    // Link staff record to the user
    await ctx.db.patch(args.userId, { staffId, updatedAt: now });

    return staffId;
  },
});

/**
 * Full onboarding: create a user account AND a staff record in one step.
 * This is the primary "Add Staff Member" flow used by school admins.
 */
export const createUserAndStaff = mutation({
  args: {
    // User fields
    email: v.optional(v.string()),
    phone: v.optional(v.string()),
    role: v.union(
      v.literal('school_admin'),
      v.literal('deputy_head'),
      v.literal('bursar'),
      v.literal('teacher'),
      v.literal('class_teacher'),
      v.literal('matron'),
      v.literal('librarian'),
      v.literal('driver'),
    ),
    // Staff fields
    firstName: v.string(),
    lastName: v.string(),
    middleName: v.optional(v.string()),
    gender: v.union(v.literal('M'), v.literal('F')),
    dateOfBirth: v.optional(v.string()),
    nrc: v.optional(v.string()),
    altPhone: v.optional(v.string()),
    address: v.optional(v.string()),
    emergencyContact: v.optional(
      v.object({
        name: v.string(),
        phone: v.string(),
        relation: v.string(),
      }),
    ),
    staffCategory: v.union(v.literal('teaching'), v.literal('non_teaching'), v.literal('admin')),
    jobTitle: v.string(),
    tcazNumber: v.optional(v.string()),
    employeeNumber: v.optional(v.string()),
    contractType: v.union(
      v.literal('permanent'),
      v.literal('contract'),
      v.literal('volunteer'),
      v.literal('intern'),
    ),
    dateJoined: v.string(),
    bankName: v.optional(v.string()),
    bankAccountNumber: v.optional(v.string()),
    napsaNumber: v.optional(v.string()),
    nhimaNumber: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.CREATE_STAFF);

    // Validate at least one contact method
    if (!args.phone?.trim() && !args.email?.trim()) {
      throwEduError(
        EduError.VALIDATION_ERROR,
        'At least one contact method (phone or email) is required.',
      );
    }

    // Check for duplicate email in this school
    if (args.email) {
      const existingEmail = await ctx.db
        .query('users')
        .withIndex('email', (q) => q.eq('email', args.email!))
        .first();
      if (existingEmail && existingEmail.schoolId === school._id) {
        throwEduError(EduError.ALREADY_EXISTS, 'A user with this email already exists.');
      }
    }

    // Check for duplicate phone in this school
    if (args.phone) {
      const existingPhone = await ctx.db
        .query('users')
        .withIndex('phone', (q) => q.eq('phone', args.phone!))
        .first();
      if (existingPhone && existingPhone.schoolId === school._id) {
        throwEduError(EduError.ALREADY_EXISTS, 'A user with this phone number already exists.');
      }
    }

    // Check for duplicate TCAZ number
    if (args.tcazNumber) {
      const existingTcaz = await ctx.db
        .query('staff')
        .withIndex('by_tcaz', (q) => q.eq('tcazNumber', args.tcazNumber!))
        .first();
      if (existingTcaz && existingTcaz.schoolId === school._id) {
        throwEduError(
          EduError.ALREADY_EXISTS,
          'A staff member with this TCAZ number already exists.',
        );
      }
    }

    const now = Date.now();

    // 1. Create user account
    const userId = await ctx.db.insert('users', {
      schoolId: school._id,
      name: `${args.firstName} ${args.lastName}`,
      phone: args.phone,
      email: args.email,
      role: args.role,
      isActive: true,
      isFirstLogin: true,
      createdAt: now,
      updatedAt: now,
    });

    // 2. Create staff profile
    const staffId = await ctx.db.insert('staff', {
      schoolId: school._id,
      userId,
      firstName: args.firstName,
      lastName: args.lastName,
      middleName: args.middleName,
      gender: args.gender,
      dateOfBirth: args.dateOfBirth,
      nrc: args.nrc,
      phone: args.phone ?? '',
      altPhone: args.altPhone,
      email: args.email,
      address: args.address,
      emergencyContact: args.emergencyContact,
      staffCategory: args.staffCategory,
      jobTitle: args.jobTitle,
      tcazNumber: args.tcazNumber,
      employeeNumber: args.employeeNumber,
      contractType: args.contractType,
      dateJoined: args.dateJoined,
      bankName: args.bankName,
      bankAccountNumber: args.bankAccountNumber,
      napsaNumber: args.napsaNumber,
      nhimaNumber: args.nhimaNumber,
      subjectIds: [],
      sectionIds: [],
      status: 'active',
      createdAt: now,
      updatedAt: now,
    });

    // 3. Link staff record to user
    await ctx.db.patch(userId, { staffId, updatedAt: now });

    return { userId, staffId };
  },
});

/**
 * Update an existing staff member's details.
 * Requires EDIT_STAFF permission.
 */
export const updateStaff = mutation({
  args: {
    staffId: v.id('staff'),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    middleName: v.optional(v.string()),
    gender: v.optional(v.union(v.literal('M'), v.literal('F'))),
    dateOfBirth: v.optional(v.string()),
    nrc: v.optional(v.string()),
    phone: v.optional(v.string()),
    altPhone: v.optional(v.string()),
    email: v.optional(v.string()),
    photoUrl: v.optional(v.string()),
    address: v.optional(v.string()),
    emergencyContact: v.optional(
      v.object({
        name: v.string(),
        phone: v.string(),
        relation: v.string(),
      }),
    ),
    staffCategory: v.optional(
      v.union(v.literal('teaching'), v.literal('non_teaching'), v.literal('admin')),
    ),
    jobTitle: v.optional(v.string()),
    tcazNumber: v.optional(v.string()),
    employeeNumber: v.optional(v.string()),
    contractType: v.optional(
      v.union(
        v.literal('permanent'),
        v.literal('contract'),
        v.literal('volunteer'),
        v.literal('intern'),
      ),
    ),
    dateJoined: v.optional(v.string()),
    dateLeft: v.optional(v.string()),
    bankName: v.optional(v.string()),
    bankAccountNumber: v.optional(v.string()),
    napsaNumber: v.optional(v.string()),
    nhimaNumber: v.optional(v.string()),
    status: v.optional(
      v.union(v.literal('active'), v.literal('on_leave'), v.literal('terminated')),
    ),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.EDIT_STAFF);

    const staff = await ctx.db.get(args.staffId);
    if (!staff || staff.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Staff member not found.');
    }

    // Check TCAZ uniqueness if changing
    if (args.tcazNumber && args.tcazNumber !== staff.tcazNumber) {
      const existingTcaz = await ctx.db
        .query('staff')
        .withIndex('by_tcaz', (q) => q.eq('tcazNumber', args.tcazNumber!))
        .first();
      if (existingTcaz && existingTcaz._id !== args.staffId && existingTcaz.schoolId === school._id) {
        throwEduError(
          EduError.ALREADY_EXISTS,
          'A staff member with this TCAZ number already exists.',
        );
      }
    }

    // Build patch object from provided fields only
    const { staffId: _id, ...updateFields } = args;
    const patch: Record<string, unknown> = { updatedAt: Date.now() };

    for (const [key, value] of Object.entries(updateFields)) {
      if (value !== undefined) {
        patch[key] = value;
      }
    }

    await ctx.db.patch(args.staffId, patch);

    // Also update user name if name fields changed
    if (args.firstName || args.lastName) {
      const firstName = args.firstName ?? staff.firstName;
      const lastName = args.lastName ?? staff.lastName;
      await ctx.db.patch(staff.userId, {
        name: `${firstName} ${lastName}`,
        updatedAt: Date.now(),
      });
    }

    return args.staffId;
  },
});

/**
 * Deactivate (terminate) a staff member.
 * Sets status to 'terminated' and dateLeft to today.
 */
export const terminateStaff = mutation({
  args: {
    staffId: v.id('staff'),
    dateLeft: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.EDIT_STAFF);

    const staff = await ctx.db.get(args.staffId);
    if (!staff || staff.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Staff member not found.');
    }

    if (staff.status === 'terminated') {
      throwEduError(EduError.CONFLICT, 'Staff member is already terminated.');
    }

    const now = Date.now();
    const dateLeft = args.dateLeft ?? new Date().toISOString().split('T')[0];

    // Update staff record
    await ctx.db.patch(args.staffId, {
      status: 'terminated',
      dateLeft,
      updatedAt: now,
    });

    // Deactivate the linked user account
    await ctx.db.patch(staff.userId, {
      isActive: false,
      updatedAt: now,
    });

    return args.staffId;
  },
});

/**
 * Reactivate a terminated staff member.
 */
export const reactivateStaff = mutation({
  args: {
    staffId: v.id('staff'),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.EDIT_STAFF);

    const staff = await ctx.db.get(args.staffId);
    if (!staff || staff.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Staff member not found.');
    }

    if (staff.status === 'active') {
      throwEduError(EduError.CONFLICT, 'Staff member is already active.');
    }

    const now = Date.now();

    await ctx.db.patch(args.staffId, {
      status: 'active',
      dateLeft: undefined,
      updatedAt: now,
    });

    await ctx.db.patch(staff.userId, {
      isActive: true,
      updatedAt: now,
    });

    return args.staffId;
  },
});
