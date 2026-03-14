import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { requirePermission } from '../_lib/permissions';
import { getAuthenticatedUserAndSchool } from '../_lib/schoolContext';
import { Permission } from '../../src/lib/roles/types';
import { EduError, throwEduError } from '../_lib/errors';

// ── ISSUE-053 · Student Transfer System ─────────────────────────────────────

/**
 * Initiate an outgoing transfer for a student.
 * - Updates student status to 'transferred_out'
 * - Clears currentSectionId
 * - Creates a transfer record
 * - Sends notification to guardian
 */
export const initiateTransferOut = mutation({
  args: {
    studentId: v.id('students'),
    toSchool: v.string(),
    reason: v.string(),
    transferDate: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user, school } = await requirePermission(ctx, Permission.TRANSFER_STUDENT);

    const student = await ctx.db.get(args.studentId);
    if (!student || student.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Student not found.');
    }

    if (student!.status !== 'active') {
      throwEduError(
        EduError.VALIDATION_ERROR,
        'Only active students can be transferred out.',
      );
    }

    // Update student status
    await ctx.db.patch(args.studentId, {
      status: 'transferred_out',
      transferOutDate: args.transferDate,
      transferOutSchool: args.toSchool.trim(),
      updatedAt: Date.now(),
    });

    // Create transfer record
    const transferId = await ctx.db.insert('transfers', {
      schoolId: school._id,
      studentId: args.studentId,
      direction: 'out',
      toSchool: args.toSchool.trim(),
      reason: args.reason.trim(),
      transferDate: args.transferDate,
      processedBy: user._id,
      notes: args.notes?.trim(),
      createdAt: Date.now(),
    });

    // Send notification to primary guardian
    const primaryLink = student!.guardianLinks?.find((l) => l.isPrimary && l.receiveSMS);
    if (primaryLink) {
      const guardian = await ctx.db.get(primaryLink.guardianId);
      if (guardian) {
        await ctx.db.insert('notifications', {
          schoolId: school._id,
          recipientPhone: guardian.phone,
          type: 'student_transfer',
          channel: 'sms',
          subject: 'Student Transfer',
          body: `Transfer processed for ${student!.firstName} ${student!.lastName} to ${args.toSchool}. Transfer letter available on the portal.`,
          status: 'queued',
          relatedEntityType: 'transfers',
          relatedEntityId: transferId as string,
          createdAt: Date.now(),
        });
      }
    }

    return transferId;
  },
});

/**
 * Record an incoming transfer (student arriving from another school).
 * This creates a transfer record with direction: 'in'.
 * The student should already be enrolled via enrolStudent with previousSchool set.
 */
export const recordTransferIn = mutation({
  args: {
    studentId: v.id('students'),
    fromSchool: v.string(),
    reason: v.string(),
    transferDate: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user, school } = await requirePermission(ctx, Permission.ENROL_STUDENT);

    const student = await ctx.db.get(args.studentId);
    if (!student || student.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Student not found.');
    }

    const transferId = await ctx.db.insert('transfers', {
      schoolId: school._id,
      studentId: args.studentId,
      direction: 'in',
      fromSchool: args.fromSchool.trim(),
      reason: args.reason.trim(),
      transferDate: args.transferDate,
      processedBy: user._id,
      notes: args.notes?.trim(),
      createdAt: Date.now(),
    });

    return transferId;
  },
});

/**
 * Get transfer history for a student.
 */
export const getTransfersByStudent = query({
  args: {
    studentId: v.id('students'),
  },
  handler: async (ctx, args) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    const student = await ctx.db.get(args.studentId);
    if (!student || student.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Student not found.');
    }

    const transfers = await ctx.db
      .query('transfers')
      .withIndex('by_student', (q) => q.eq('studentId', args.studentId))
      .collect();

    // Resolve processedBy user names
    const enriched = await Promise.all(
      transfers.map(async (transfer) => {
        const processedBy = await ctx.db.get(transfer.processedBy);
        return {
          ...transfer,
          processedByName: processedBy?.name ?? 'Unknown',
        };
      }),
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});

/**
 * Get all transfers for the school (admin view).
 */
export const getSchoolTransfers = query({
  args: {
    direction: v.optional(v.union(v.literal('in'), v.literal('out'))),
  },
  handler: async (ctx, args) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    let transfers = await ctx.db
      .query('transfers')
      .withIndex('by_school', (q) => q.eq('schoolId', school._id))
      .collect();

    if (args.direction) {
      transfers = transfers.filter((t) => t.direction === args.direction);
    }

    // Resolve student names
    const enriched = await Promise.all(
      transfers.map(async (transfer) => {
        const student = await ctx.db.get(transfer.studentId);
        const processedBy = await ctx.db.get(transfer.processedBy);
        return {
          ...transfer,
          studentName: student
            ? `${student.firstName} ${student.lastName}`
            : 'Unknown',
          studentNumber: student?.studentNumber,
          processedByName: processedBy?.name ?? 'Unknown',
        };
      }),
    );

    return enriched.sort((a, b) => b.createdAt - a.createdAt);
  },
});
