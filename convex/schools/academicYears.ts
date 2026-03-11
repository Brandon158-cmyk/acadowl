import { mutation, query } from '../_generated/server';
import { v } from 'convex/values';
import { requirePermission } from '../_lib/permissions';
import { withSchoolScope } from '../_lib/schoolContext';
import { Permission } from '../../src/lib/roles/types';
import { EduError, throwEduError } from '../_lib/errors';

/**
 * ISSUE-041 · Academic Year CRUD and Activation
 *
 * Manages the academic year lifecycle: create → activate → close.
 * Only one academic year can be active at a time per school.
 */

// ────────────────────────────────────────
// Mutations
// ────────────────────────────────────────

/**
 * Create a new academic year for the school.
 * Auto-generates label if not provided.
 */
export const createAcademicYear = mutation({
  args: {
    year: v.number(),
    label: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.MANAGE_SCHOOL_SETTINGS);

    // Validate no duplicate year for this school
    const existing = await ctx.db
      .query('academicYears')
      .withIndex('by_school_year', (q) => q.eq('schoolId', school._id).eq('year', args.year))
      .unique();

    if (existing) {
      throwEduError(EduError.ALREADY_EXISTS, `Academic year ${args.year} already exists.`);
    }

    // Validate date range
    if (args.startDate >= args.endDate) {
      throwEduError(EduError.VALIDATION_ERROR, 'Start date must be before end date.');
    }

    const label = args.label || `${args.year} Academic Year`;

    const yearId = await ctx.db.insert('academicYears', {
      schoolId: school._id,
      year: args.year,
      label,
      startDate: args.startDate,
      endDate: args.endDate,
      isActive: false,
      createdAt: Date.now(),
    });

    return yearId;
  },
});

/**
 * Activate an academic year.
 * Deactivates all other years for the school and updates `school.currentAcademicYearId`.
 */
export const activateAcademicYear = mutation({
  args: {
    academicYearId: v.id('academicYears'),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.MANAGE_SCHOOL_SETTINGS);

    // Verify the target year belongs to this school
    const targetYear = await ctx.db.get(args.academicYearId);
    if (!targetYear || targetYear.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Academic year not found.');
    }

    // Deactivate all other years for this school
    const allYears = await ctx.db
      .query('academicYears')
      .withIndex('by_school', (q) => q.eq('schoolId', school._id))
      .collect();

    for (const year of allYears) {
      if (year.isActive && year._id !== args.academicYearId) {
        await ctx.db.patch(year._id, { isActive: false });
      }
    }

    // Activate the target year
    await ctx.db.patch(args.academicYearId, { isActive: true });

    // Update school's current academic year pointer
    await ctx.db.patch(school._id, {
      currentAcademicYearId: args.academicYearId,
      updatedAt: Date.now(),
    });

    return args.academicYearId;
  },
});

/**
 * Close an academic year.
 * Sets isActive to false. Does NOT delete data — all historical records remain queryable.
 */
export const closeAcademicYear = mutation({
  args: {
    academicYearId: v.id('academicYears'),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.MANAGE_SCHOOL_SETTINGS);

    const year = await ctx.db.get(args.academicYearId);
    if (!year || year.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Academic year not found.');
    }

    if (!year.isActive) {
      throwEduError(EduError.VALIDATION_ERROR, 'This academic year is already closed.');
    }

    // Get all terms for this year (needed below for deactivation)
    const terms = await ctx.db
      .query('terms')
      .withIndex('by_academic_year', (q) =>
        q.eq('schoolId', school._id).eq('academicYearId', args.academicYearId),
      )
      .collect();

    // TODO: When examSessions table is added (Sprint 01 Epic 5),
    // add validation to prevent closing a year with unlocked exam results.

    // Deactivate the year
    await ctx.db.patch(args.academicYearId, { isActive: false });

    // Clear school pointer if it was pointing to this year
    if (school.currentAcademicYearId === args.academicYearId) {
      await ctx.db.patch(school._id, {
        currentAcademicYearId: undefined,
        currentTermId: undefined,
        updatedAt: Date.now(),
      });
    }

    // Deactivate any active terms within this year
    for (const term of terms) {
      if (term.isActive) {
        await ctx.db.patch(term._id, { isActive: false });
      }
    }

    return args.academicYearId;
  },
});

// ────────────────────────────────────────
// Queries
// ────────────────────────────────────────

/**
 * Get all academic years for the current school, sorted descending by year.
 */
export const getAcademicYears = query({
  args: {},
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ ctx, schoolId }) => {
      const years = await ctx.db
        .query('academicYears')
        .withIndex('by_school', (q) => q.eq('schoolId', schoolId))
        .collect();

      // Sort by year descending
      return years.sort((a, b) => b.year - a.year);
    });
  },
});

/**
 * Get the currently active academic year (or null).
 */
export const getCurrentAcademicYear = query({
  args: {},
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ ctx, school }) => {
      if (!school.currentAcademicYearId) return null;
      return ctx.db.get(school.currentAcademicYearId);
    });
  },
});
