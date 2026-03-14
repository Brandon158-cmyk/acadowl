import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { requirePermission } from '../_lib/permissions';
import { getAuthenticatedUserAndSchool } from '../_lib/schoolContext';
import { Permission } from '../../src/lib/roles/types';
import { EduError, throwEduError } from '../_lib/errors';

// ── ISSUE-048 · Guardian Helpers for Student Enrolment ──────────────────────

/**
 * Search for an existing guardian by phone number within the school.
 * Used by the enrolment form Step 3 to pre-fill guardian info.
 */
export const searchGuardianByPhone = query({
  args: {
    phone: v.string(),
  },
  handler: async (ctx, args) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    if (!args.phone || args.phone.trim().length < 4) return null;

    const guardian = await ctx.db
      .query('guardians')
      .withIndex('by_school_phone', (q) =>
        q.eq('schoolId', school._id).eq('phone', args.phone.trim()),
      )
      .first();

    if (!guardian) return null;

    // Find linked students to show context
    const allStudents = await ctx.db
      .query('students')
      .withIndex('by_school', (q) => q.eq('schoolId', school._id))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect();

    const linkedStudents = allStudents
      .filter((s) =>
        s.guardianLinks?.some((link) => link.guardianId === guardian._id),
      )
      .map((s) => ({
        _id: s._id,
        firstName: s.firstName,
        lastName: s.lastName,
        studentNumber: s.studentNumber,
      }));

    return {
      _id: guardian._id,
      firstName: guardian.firstName,
      lastName: guardian.lastName,
      phone: guardian.phone,
      altPhone: guardian.altPhone,
      email: guardian.email,
      nrc: guardian.nrc,
      linkedStudents,
    };
  },
});

/**
 * Link an existing guardian to a student.
 */
export const linkGuardianToStudent = mutation({
  args: {
    studentId: v.id('students'),
    guardianId: v.id('guardians'),
    relation: v.string(),
    isPrimary: v.boolean(),
    canPayFees: v.boolean(),
    canSeeResults: v.boolean(),
    canSeeAttendance: v.boolean(),
    receiveSMS: v.boolean(),
    canAuthorizeLeave: v.boolean(),
    isEmergencyContact: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.EDIT_STUDENT);

    const student = await ctx.db.get(args.studentId);
    if (!student || student.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Student not found.');
    }

    const guardian = await ctx.db.get(args.guardianId);
    if (!guardian || guardian.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Guardian not found.');
    }

    // Check if already linked
    const alreadyLinked = student!.guardianLinks?.some(
      (link) => link.guardianId === args.guardianId,
    );
    if (alreadyLinked) {
      throwEduError(EduError.ALREADY_EXISTS, 'This guardian is already linked to this student.');
    }

    // If marking as primary, demote existing primary
    const updatedLinks = [...(student!.guardianLinks || [])];
    if (args.isPrimary) {
      for (let i = 0; i < updatedLinks.length; i++) {
        updatedLinks[i] = { ...updatedLinks[i], isPrimary: false };
      }
    }

    updatedLinks.push({
      guardianId: args.guardianId,
      isPrimary: args.isPrimary,
      relation: args.relation,
      canPayFees: args.canPayFees,
      canSeeResults: args.canSeeResults,
      canSeeAttendance: args.canSeeAttendance,
      receiveSMS: args.receiveSMS,
      canAuthorizeLeave: args.canAuthorizeLeave,
      isEmergencyContact: args.isEmergencyContact,
    });

    await ctx.db.patch(args.studentId, {
      guardianLinks: updatedLinks,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Unlink a guardian from a student.
 */
export const unlinkGuardianFromStudent = mutation({
  args: {
    studentId: v.id('students'),
    guardianId: v.id('guardians'),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.EDIT_STUDENT);

    const student = await ctx.db.get(args.studentId);
    if (!student || student.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Student not found.');
    }

    const updatedLinks = (student!.guardianLinks || []).filter(
      (link) => link.guardianId !== args.guardianId,
    );

    await ctx.db.patch(args.studentId, {
      guardianLinks: updatedLinks,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Update guardian link permissions for a student.
 */
export const updateGuardianLink = mutation({
  args: {
    studentId: v.id('students'),
    guardianId: v.id('guardians'),
    relation: v.optional(v.string()),
    isPrimary: v.optional(v.boolean()),
    canPayFees: v.optional(v.boolean()),
    canSeeResults: v.optional(v.boolean()),
    canSeeAttendance: v.optional(v.boolean()),
    receiveSMS: v.optional(v.boolean()),
    canAuthorizeLeave: v.optional(v.boolean()),
    isEmergencyContact: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.EDIT_STUDENT);

    const student = await ctx.db.get(args.studentId);
    if (!student || student.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Student not found.');
    }

    const updatedLinks = (student!.guardianLinks || []).map((link) => {
      if (link.guardianId !== args.guardianId) {
        // If setting new primary, demote others
        if (args.isPrimary) {
          return { ...link, isPrimary: false };
        }
        return link;
      }
      return {
        ...link,
        ...(args.relation !== undefined && { relation: args.relation }),
        ...(args.isPrimary !== undefined && { isPrimary: args.isPrimary }),
        ...(args.canPayFees !== undefined && { canPayFees: args.canPayFees }),
        ...(args.canSeeResults !== undefined && { canSeeResults: args.canSeeResults }),
        ...(args.canSeeAttendance !== undefined && { canSeeAttendance: args.canSeeAttendance }),
        ...(args.receiveSMS !== undefined && { receiveSMS: args.receiveSMS }),
        ...(args.canAuthorizeLeave !== undefined && { canAuthorizeLeave: args.canAuthorizeLeave }),
        ...(args.isEmergencyContact !== undefined && {
          isEmergencyContact: args.isEmergencyContact,
        }),
      };
    });

    await ctx.db.patch(args.studentId, {
      guardianLinks: updatedLinks,
      updatedAt: Date.now(),
    });
  },
});
