import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { requirePermission } from '../_lib/permissions';
import { getAuthenticatedUserAndSchool } from '../_lib/schoolContext';
import { Permission } from '../../src/lib/roles/types';
import { EduError, throwEduError } from '../_lib/errors';

// ── ISSUE-056 · Student-Section History & Audit Trail ──

/**
 * Get the full section history for a student.
 * Enriched with section name, grade name, and who made the change.
 */
export const getSectionHistory = query({
  args: {
    studentId: v.id('students'),
  },
  handler: async (ctx, args) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    const student = await ctx.db.get(args.studentId);
    if (!student || student.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Student not found.');
    }

    const history = await ctx.db
      .query('sectionHistory')
      .withIndex('by_student', (q) => q.eq('studentId', args.studentId))
      .collect();

    const enriched = await Promise.all(
      history.map(async (h) => {
        const section = await ctx.db.get(h.sectionId);
        const grade = await ctx.db.get(h.gradeId);
        const academicYear = await ctx.db.get(h.academicYearId);
        const changedByUser = await ctx.db.get(h.changedBy);

        return {
          ...h,
          sectionDisplayName: section?.displayName ?? 'Unknown',
          gradeName: grade?.name ?? 'Unknown',
          academicYearLabel: academicYear?.label ?? 'Unknown',
          changedByName: changedByUser?.name ?? 'System',
        };
      }),
    );

    // Sort by fromDate descending (most recent first)
    return enriched.sort((a, b) => b.fromDate.localeCompare(a.fromDate));
  },
});

// ── ISSUE-057 · Inter-Section Student Transfer ──

/**
 * Move a student from one section to another within the same grade and academic year.
 * Creates a sectionHistory record and closes the previous one.
 */
export const transferBetweenSections = mutation({
  args: {
    studentId: v.id('students'),
    toSectionId: v.id('sections'),
    reason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user, school } = await requirePermission(ctx, Permission.EDIT_STUDENT);

    const student = await ctx.db.get(args.studentId);
    if (!student || student.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Student not found.');
    }

    if (student.status !== 'active') {
      throwEduError(EduError.CONFLICT, 'Can only transfer active students.');
    }

    const toSection = await ctx.db.get(args.toSectionId);
    if (!toSection || toSection.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Target section not found.');
    }

    // Must be same grade
    if (toSection.gradeId !== student.currentGradeId) {
      throwEduError(
        EduError.VALIDATION_ERROR,
        'Inter-section transfer must be within the same grade. Use promotion for grade changes.',
      );
    }

    // Can't transfer to same section
    if (args.toSectionId === student.currentSectionId) {
      throwEduError(EduError.VALIDATION_ERROR, 'Student is already in this section.');
    }

    if (!school.currentAcademicYearId) {
      throwEduError(EduError.VALIDATION_ERROR, 'No active academic year.');
    }

    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];

    // Close the current sectionHistory record (set toDate)
    const currentRecord = await ctx.db
      .query('sectionHistory')
      .withIndex('by_student', (q) => q.eq('studentId', args.studentId))
      .filter((q) => q.eq(q.field('toDate'), undefined))
      .first();

    if (currentRecord) {
      await ctx.db.patch(currentRecord._id, { toDate: today });
    }

    // Create new sectionHistory record
    await ctx.db.insert('sectionHistory', {
      schoolId: school._id,
      studentId: args.studentId,
      sectionId: args.toSectionId,
      gradeId: student.currentGradeId,
      academicYearId: school.currentAcademicYearId,
      fromDate: today,
      reason: 'section_transfer',
      changedBy: user._id,
      createdAt: now,
    });

    // Update student's currentSectionId
    await ctx.db.patch(args.studentId, {
      currentSectionId: args.toSectionId,
      updatedAt: now,
    });

    return args.studentId;
  },
});

/**
 * Bulk transfer students between sections.
 * Used from the student list bulk actions.
 */
export const bulkTransferBetweenSections = mutation({
  args: {
    transfers: v.array(
      v.object({
        studentId: v.id('students'),
        toSectionId: v.id('sections'),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { user, school } = await requirePermission(ctx, Permission.EDIT_STUDENT);

    if (!school.currentAcademicYearId) {
      throwEduError(EduError.VALIDATION_ERROR, 'No active academic year.');
    }

    const now = Date.now();
    const today = new Date().toISOString().split('T')[0];
    let transferred = 0;

    for (const transfer of args.transfers) {
      const student = await ctx.db.get(transfer.studentId);
      if (!student || student.schoolId !== school._id || student.status !== 'active') {
        continue; // Skip invalid students in bulk operations
      }

      if (transfer.toSectionId === student.currentSectionId) {
        continue; // Already in this section
      }

      const toSection = await ctx.db.get(transfer.toSectionId);
      if (!toSection || toSection.schoolId !== school._id) {
        continue;
      }

      if (toSection.gradeId !== student.currentGradeId) {
        continue; // Must be same grade
      }

      // Close current history record
      const currentRecord = await ctx.db
        .query('sectionHistory')
        .withIndex('by_student', (q) => q.eq('studentId', transfer.studentId))
        .filter((q) => q.eq(q.field('toDate'), undefined))
        .first();

      if (currentRecord) {
        await ctx.db.patch(currentRecord._id, { toDate: today });
      }

      // Create new history record
      await ctx.db.insert('sectionHistory', {
        schoolId: school._id,
        studentId: transfer.studentId,
        sectionId: transfer.toSectionId,
        gradeId: student.currentGradeId,
        academicYearId: school.currentAcademicYearId!,
        fromDate: today,
        reason: 'section_transfer',
        changedBy: user._id,
        createdAt: now,
      });

      // Update student
      await ctx.db.patch(transfer.studentId, {
        currentSectionId: transfer.toSectionId,
        updatedAt: now,
      });

      transferred++;
    }

    return { transferred, total: args.transfers.length };
  },
});
