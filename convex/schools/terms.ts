import { mutation, query } from '../_generated/server';
import { v } from 'convex/values';
import { requirePermission } from '../_lib/permissions';
import { withSchoolScope } from '../_lib/schoolContext';
import { Permission } from '../../src/lib/roles/types';
import { EduError, throwEduError } from '../_lib/errors';
import { validateTermDates } from './validation';

/**
 * ISSUE-042 · Term Management and Active Term System
 *
 * Terms are the operational unit of the school year.
 * Every invoice, attendance report, and exam result is scoped to a term.
 * The active term must be explicitly set — it never auto-advances.
 */

// ────────────────────────────────────────
// Mutations
// ────────────────────────────────────────

/**
 * Bulk create terms for an academic year.
 * Validates: no overlapping dates, correct count based on academicMode.
 */
export const createTerms = mutation({
  args: {
    academicYearId: v.id('academicYears'),
    terms: v.array(
      v.object({
        name: v.string(),
        termNumber: v.number(),
        startDate: v.string(),
        endDate: v.string(),
        examStartDate: v.optional(v.string()),
        examEndDate: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.MANAGE_SCHOOL_SETTINGS);

    // Verify academic year belongs to this school
    const academicYear = await ctx.db.get(args.academicYearId);
    if (!academicYear || academicYear.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Academic year not found.');
    }

    // Validate term count and overlaps based on academic mode
    try {
      validateTermDates(school.academicMode as 'semester' | 'term', args.terms);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Validation failed';
      throwEduError(EduError.VALIDATION_ERROR, msg);
    }

    // Check for existing terms in this academic year
    const existingTerms = await ctx.db;

    // Create all terms
    const sortedTerms = [...args.terms].sort((a, b) => a.startDate.localeCompare(b.startDate));
    const now = Date.now();
    const termIds = [];
    for (const term of sortedTerms) {
      const termId = await ctx.db.insert('terms', {
        schoolId: school._id,
        academicYearId: args.academicYearId,
        name: term.name,
        termNumber: term.termNumber,
        startDate: term.startDate,
        endDate: term.endDate,
        examStartDate: term.examStartDate,
        examEndDate: term.examEndDate,
        isActive: false,
        createdAt: now,
      });
      termIds.push(termId);
    }

    return termIds;
  },
});

/**
 * Activate a term.
 * Deactivates the previous active term and updates `school.currentTermId`.
 */
export const activateTerm = mutation({
  args: {
    termId: v.id('terms'),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.MANAGE_SCHOOL_SETTINGS);

    // Verify the term belongs to this school
    const term = await ctx.db.get(args.termId);
    if (!term || term.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Term not found.');
    }

    // Verify the term's academic year is active
    const academicYear = await ctx.db.get(term.academicYearId);
    if (!academicYear || !academicYear.isActive) {
      throwEduError(
        EduError.VALIDATION_ERROR,
        'Cannot activate a term in an inactive academic year. Activate the academic year first.',
      );
    }

    // Deactivate all other terms for this school
    const activeTerms = await ctx.db
      .query('terms')
      .withIndex('by_school_active', (q) => q.eq('schoolId', school._id).eq('isActive', true))
      .collect();

    for (const activeTerm of activeTerms) {
      if (activeTerm._id !== args.termId) {
        await ctx.db.patch(activeTerm._id, { isActive: false });
      }
    }

    // Activate the target term
    await ctx.db.patch(args.termId, { isActive: true });

    // Update school's current term pointer
    await ctx.db.patch(school._id, {
      currentTermId: args.termId,
      updatedAt: Date.now(),
    });

    return args.termId;
  },
});

/**
 * Update term dates after creation (e.g., for school calendar changes).
 */
export const updateTermDates = mutation({
  args: {
    termId: v.id('terms'),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    examStartDate: v.optional(v.string()),
    examEndDate: v.optional(v.string()),
    name: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.MANAGE_SCHOOL_SETTINGS);

    const term = await ctx.db.get(args.termId);
    if (!term || term.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Term not found.');
    }

    const updates: Record<string, unknown> = {};
    if (args.startDate) updates.startDate = args.startDate;
    if (args.endDate) updates.endDate = args.endDate;
    if (args.examStartDate !== undefined) updates.examStartDate = args.examStartDate;
    if (args.examEndDate !== undefined) updates.examEndDate = args.examEndDate;
    if (args.name) updates.name = args.name;

    // Validate date range if both are being updated
    const newStart = args.startDate || term.startDate;
    const newEnd = args.endDate || term.endDate;
    if (newStart >= newEnd) {
      throwEduError(EduError.VALIDATION_ERROR, 'Start date must be before end date.');
    }

    await ctx.db.patch(args.termId, updates);
    return args.termId;
  },
});

// ────────────────────────────────────────
// Queries
// ────────────────────────────────────────

/**
 * Get all terms for a given academic year, ordered by termNumber.
 */
export const getTermsByYear = query({
  args: {
    academicYearId: v.id('academicYears'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ ctx, schoolId }) => {
      const terms = await ctx.db
        .query('terms')
        .withIndex('by_academic_year', (q) =>
          q.eq('schoolId', schoolId).eq('academicYearId', args.academicYearId),
        )
        .collect();

      return terms.sort((a, b) => a.termNumber - b.termNumber);
    });
  },
});

/**
 * Get the currently active term with days remaining calculated.
 */
export const getCurrentTerm = query({
  args: {},
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ ctx, school }) => {
      if (!school.currentTermId) return null;

      const term = await ctx.db.get(school.currentTermId);
      if (!term) return null;

      // Calculate days remaining
      const today = new Date();
      const endDate = new Date(term.endDate);
      const diffMs = endDate.getTime() - today.getTime();
      const daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

      // Check if currently in exam period
      let isExamPeriod = false;
      if (term.examStartDate && term.examEndDate) {
        const todayStr = today.toISOString().split('T')[0];
        isExamPeriod = todayStr >= term.examStartDate && todayStr <= term.examEndDate;
      }

      return {
        ...term,
        daysRemaining,
        isExamPeriod,
      };
    });
  },
});
