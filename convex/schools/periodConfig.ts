import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { requirePermission } from '../_lib/permissions';
import { Permission } from '../../src/lib/roles/types';
import { getAuthenticatedUserAndSchool } from '../_lib/schoolContext';

// ── ISSUE-064 · Period Timetable Configuration ──

/**
 * Get the period configuration for the current school.
 * Returns null if not yet configured.
 */
export const getPeriodConfig = query({
  args: {},
  handler: async (ctx) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);
    return school.periodConfig ?? null;
  },
});

/**
 * Update the school's period configuration.
 * Validates that periods are in chronological order and don't overlap.
 */
export const updatePeriodConfig = mutation({
  args: {
    periodsPerDay: v.number(),
    periods: v.array(
      v.object({
        number: v.number(),
        label: v.string(),
        startTime: v.string(),
        endTime: v.string(),
        isBreak: v.boolean(),
        isOptional: v.boolean(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.MANAGE_SCHOOL_SETTINGS);

    // Validate: at least 1 period
    if (args.periods.length === 0) {
      throw new Error('At least one period is required.');
    }

    // Validate: periodsPerDay matches non-break period count
    const teachingPeriods = args.periods.filter((p) => !p.isBreak);
    if (teachingPeriods.length !== args.periodsPerDay) {
      throw new Error(
        `periodsPerDay (${args.periodsPerDay}) must match the number of non-break periods (${teachingPeriods.length}).`,
      );
    }

    // Validate: times are in HH:MM format and chronological
    for (let i = 0; i < args.periods.length; i++) {
      const period = args.periods[i];
      if (!/^\d{2}:\d{2}$/.test(period.startTime) || !/^\d{2}:\d{2}$/.test(period.endTime)) {
        throw new Error(`Period ${period.number}: times must be in HH:MM format.`);
      }
      if (period.startTime >= period.endTime) {
        throw new Error(`Period ${period.number}: start time must be before end time.`);
      }
      // Check no overlap with previous period
      if (i > 0) {
        const prev = args.periods[i - 1];
        if (period.startTime < prev.endTime) {
          throw new Error(
            `Period ${period.number} starts at ${period.startTime} which overlaps with period ${prev.number} ending at ${prev.endTime}.`,
          );
        }
      }
    }

    await ctx.db.patch(school._id, {
      periodConfig: {
        periodsPerDay: args.periodsPerDay,
        periods: args.periods,
      },
      updatedAt: Date.now(),
    });
  },
});

/**
 * Seed a default Zambian school period configuration.
 * Standard 8-period day with assembly, morning break, and lunch break.
 */
export const seedDefaultPeriodConfig = mutation({
  args: {},
  handler: async (ctx) => {
    const { school } = await requirePermission(ctx, Permission.MANAGE_SCHOOL_SETTINGS);

    if (school.periodConfig) {
      throw new Error('Period configuration already exists. Clear it first before seeding defaults.');
    }

    const defaultPeriods = [
      { number: 1, label: 'Assembly', startTime: '07:00', endTime: '07:20', isBreak: true, isOptional: false },
      { number: 2, label: 'Period 1', startTime: '07:20', endTime: '08:00', isBreak: false, isOptional: false },
      { number: 3, label: 'Period 2', startTime: '08:00', endTime: '08:40', isBreak: false, isOptional: false },
      { number: 4, label: 'Period 3', startTime: '08:40', endTime: '09:20', isBreak: false, isOptional: false },
      { number: 5, label: 'Break', startTime: '09:20', endTime: '09:40', isBreak: true, isOptional: false },
      { number: 6, label: 'Period 4', startTime: '09:40', endTime: '10:20', isBreak: false, isOptional: false },
      { number: 7, label: 'Period 5', startTime: '10:20', endTime: '11:00', isBreak: false, isOptional: false },
      { number: 8, label: 'Period 6', startTime: '11:00', endTime: '11:40', isBreak: false, isOptional: false },
      { number: 9, label: 'Lunch', startTime: '11:40', endTime: '12:20', isBreak: true, isOptional: false },
      { number: 10, label: 'Period 7', startTime: '12:20', endTime: '13:00', isBreak: false, isOptional: false },
      { number: 11, label: 'Period 8', startTime: '13:00', endTime: '13:40', isBreak: false, isOptional: true },
    ];

    await ctx.db.patch(school._id, {
      periodConfig: {
        periodsPerDay: 8,
        periods: defaultPeriods,
      },
      updatedAt: Date.now(),
    });
  },
});

/**
 * Clear the period configuration (reset).
 * Only allowed if no timetable slots exist for the current term.
 */
export const clearPeriodConfig = mutation({
  args: {},
  handler: async (ctx) => {
    const { school } = await requirePermission(ctx, Permission.MANAGE_SCHOOL_SETTINGS);

    if (school.currentTermId) {
      const existingSlots = await ctx.db
        .query('timetableSlots')
        .withIndex('by_school', (q) => q.eq('schoolId', school._id))
        .first();

      if (existingSlots) {
        throw new Error(
          'Cannot clear period configuration while timetable slots exist. Delete all timetable slots first.',
        );
      }
    }

    await ctx.db.patch(school._id, {
      periodConfig: undefined,
      updatedAt: Date.now(),
    });
  },
});
