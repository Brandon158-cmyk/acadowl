import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { getAuthenticatedUserAndSchool } from '../_lib/schoolContext';
import { requirePermission } from '../_lib/permissions';
import { Permission } from '../../src/lib/roles/types';
import { EduError, throwEduError } from '../_lib/errors';

// ── ISSUE-059 · Staff Subject and Section Assignment ──

/**
 * Assign a staff member to teach a subject in a section.
 * Validates no duplicate assignment exists.
 */
export const assignStaffToSubjectSection = mutation({
  args: {
    staffId: v.id('staff'),
    subjectId: v.id('subjects'),
    sectionId: v.id('sections'),
    academicYearId: v.id('academicYears'),
    termId: v.optional(v.id('terms')),
    isPrimaryTeacher: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.MANAGE_SCHOOL_SETTINGS);

    // Validate staff belongs to this school
    const staff = await ctx.db.get(args.staffId);
    if (!staff || staff.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Staff member not found or does not belong to your school.');
    }

    // Validate subject belongs to this school
    const subject = await ctx.db.get(args.subjectId);
    if (!subject || subject.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Subject not found or does not belong to your school.');
    }

    // Validate section belongs to this school
    const section = await ctx.db.get(args.sectionId);
    if (!section || section.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Section not found or does not belong to your school.');
    }

    // Validate academic year belongs to this school
    const academicYear = await ctx.db.get(args.academicYearId);
    if (!academicYear || academicYear.schoolId !== school._id) {
      throwEduError(
        EduError.NOT_FOUND,
        'Academic year not found or does not belong to your school.',
      );
    }

    // Check for duplicate assignment (same staff + subject + section + academic year)
    const existing = await ctx.db
      .query('staffSubjectAssignments')
      .withIndex('by_staff', (q) => q.eq('staffId', args.staffId))
      .filter((q) =>
        q.and(
          q.eq(q.field('subjectId'), args.subjectId),
          q.eq(q.field('sectionId'), args.sectionId),
          q.eq(q.field('academicYearId'), args.academicYearId),
        ),
      )
      .first();

    if (existing) {
      throwEduError(
        EduError.ALREADY_EXISTS,
        `This teacher is already assigned to ${subject!.name} in ${section!.displayName}.`,
      );
    }

    const assignmentId = await ctx.db.insert('staffSubjectAssignments', {
      schoolId: school._id,
      staffId: args.staffId,
      subjectId: args.subjectId,
      sectionId: args.sectionId,
      academicYearId: args.academicYearId,
      termId: args.termId,
      isPrimaryTeacher: args.isPrimaryTeacher,
      createdAt: Date.now(),
    });

    // Update the staff member's subjectIds and sectionIds arrays
    const updatedSubjectIds = staff!.subjectIds.includes(args.subjectId)
      ? staff!.subjectIds
      : [...staff!.subjectIds, args.subjectId];
    const updatedSectionIds = staff!.sectionIds.includes(args.sectionId)
      ? staff!.sectionIds
      : [...staff!.sectionIds, args.sectionId];

    await ctx.db.patch(args.staffId, {
      subjectIds: updatedSubjectIds,
      sectionIds: updatedSectionIds,
      updatedAt: Date.now(),
    });

    return assignmentId;
  },
});

/**
 * Remove a staff assignment.
 * Checks if teacher has open exam results before allowing removal.
 */
export const removeStaffAssignment = mutation({
  args: {
    assignmentId: v.id('staffSubjectAssignments'),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.MANAGE_SCHOOL_SETTINGS);

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment || assignment.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Assignment not found.');
    }

    // Check if teacher has unlocked exam results for this subject-section combo
    const openResults = await ctx.db
      .query('examResults')
      .withIndex('by_school', (q) => q.eq('schoolId', school._id))
      .filter((q) =>
        q.and(
          q.eq(q.field('subjectId'), assignment!.subjectId),
          q.eq(q.field('sectionId'), assignment!.sectionId),
          q.eq(q.field('lockedAt'), undefined),
        ),
      )
      .first();

    if (openResults) {
      throwEduError(
        EduError.CONFLICT,
        'Cannot remove this assignment — teacher has unlocked exam results for this subject and section. Lock results first.',
      );
    }

    await ctx.db.delete(args.assignmentId);

    // Recalculate the staff member's subjectIds and sectionIds from remaining assignments
    const remainingAssignments = await ctx.db
      .query('staffSubjectAssignments')
      .withIndex('by_staff', (q) => q.eq('staffId', assignment!.staffId))
      .collect();

    const subjectIds = [...new Set(remainingAssignments.map((a) => a.subjectId))];
    const sectionIds = [...new Set(remainingAssignments.map((a) => a.sectionId))];

    await ctx.db.patch(assignment!.staffId, {
      subjectIds,
      sectionIds,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Get all subject-section assignments for a staff member.
 * Enriches with subject name, section displayName, and grade name.
 */
export const getAssignmentsForStaff = query({
  args: {
    staffId: v.id('staff'),
    academicYearId: v.optional(v.id('academicYears')),
  },
  handler: async (ctx, args) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    const staff = await ctx.db.get(args.staffId);
    if (!staff || staff.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Staff member not found.');
    }

    let assignments = await ctx.db
      .query('staffSubjectAssignments')
      .withIndex('by_staff', (q) => q.eq('staffId', args.staffId))
      .collect();

    // Filter by academic year if specified
    if (args.academicYearId) {
      assignments = assignments.filter((a) => a.academicYearId === args.academicYearId);
    }

    // Enrich with subject, section, and grade data
    const enriched = await Promise.all(
      assignments.map(async (a) => {
        const subject = await ctx.db.get(a.subjectId);
        const section = await ctx.db.get(a.sectionId);
        const grade = section ? await ctx.db.get(section.gradeId) : null;

        return {
          ...a,
          subjectName: subject?.name ?? 'Unknown',
          subjectCode: subject?.code ?? '',
          sectionDisplayName: section?.displayName ?? 'Unknown',
          gradeName: grade?.name ?? 'Unknown',
          gradeLevel: grade?.level ?? 0,
        };
      }),
    );

    return enriched.sort((a, b) => a.gradeLevel - b.gradeLevel || a.subjectName.localeCompare(b.subjectName));
  },
});

/**
 * Get all teacher-subject assignments for a section.
 * Used for timetable building and section management.
 */
export const getAssignmentsForSection = query({
  args: {
    sectionId: v.id('sections'),
  },
  handler: async (ctx, args) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    const section = await ctx.db.get(args.sectionId);
    if (!section || section.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Section not found.');
    }

    const assignments = await ctx.db
      .query('staffSubjectAssignments')
      .withIndex('by_section', (q) => q.eq('sectionId', args.sectionId))
      .collect();

    const enriched = await Promise.all(
      assignments.map(async (a) => {
        const staff = await ctx.db.get(a.staffId);
        const subject = await ctx.db.get(a.subjectId);

        return {
          ...a,
          staffFirstName: staff?.firstName ?? 'Unknown',
          staffLastName: staff?.lastName ?? 'Unknown',
          staffPhotoUrl: staff?.photoUrl,
          subjectName: subject?.name ?? 'Unknown',
          subjectCode: subject?.code ?? '',
        };
      }),
    );

    return enriched.sort((a, b) => a.subjectName.localeCompare(b.subjectName));
  },
});

/**
 * Get subjects in a section that have no teacher assigned.
 * Helps admins identify coverage gaps.
 */
export const getUnassignedSubjects = query({
  args: {
    sectionId: v.id('sections'),
    academicYearId: v.id('academicYears'),
  },
  handler: async (ctx, args) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    const section = await ctx.db.get(args.sectionId);
    if (!section || section.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Section not found.');
    }

    // Get grade to find all applicable subjects
    const grade = await ctx.db.get(section!.gradeId);
    if (!grade) {
      throwEduError(EduError.NOT_FOUND, 'Grade not found.');
    }

    // Get all subjects for this grade
    const allSubjects = await ctx.db
      .query('subjects')
      .withIndex('by_school', (q) => q.eq('schoolId', school._id))
      .collect();

    const gradeSubjects = allSubjects.filter((s) => s.gradeIds.includes(section!.gradeId));

    // Get existing assignments for this section
    const assignments = await ctx.db
      .query('staffSubjectAssignments')
      .withIndex('by_section', (q) => q.eq('sectionId', args.sectionId))
      .filter((q) => q.eq(q.field('academicYearId'), args.academicYearId))
      .collect();

    const assignedSubjectIds = new Set(assignments.map((a) => a.subjectId));

    // Return subjects not yet assigned
    return gradeSubjects
      .filter((s) => !assignedSubjectIds.has(s._id))
      .map((s) => ({
        _id: s._id,
        name: s.name,
        code: s.code,
        isCompulsory: s.isCompulsory,
      }));
  },
});

/**
 * Get all teaching staff for a school (for assignment dropdowns).
 */
export const getTeachingStaff = query({
  args: {},
  handler: async (ctx) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    const staff = await ctx.db
      .query('staff')
      .withIndex('by_school_status', (q) => q.eq('schoolId', school._id).eq('status', 'active'))
      .collect();

    // Filter to teaching staff only
    const teachingStaff = staff.filter(
      (s) => s.staffCategory === 'teaching' || s.staffCategory === 'admin',
    );

    return teachingStaff
      .map((s) => ({
        _id: s._id,
        firstName: s.firstName,
        lastName: s.lastName,
        photoUrl: s.photoUrl,
        jobTitle: s.jobTitle,
        assignmentCount: s.sectionIds.length,
      }))
      .sort((a, b) => a.lastName.localeCompare(b.lastName));
  },
});
