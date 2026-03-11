import { mutation, query } from '../_generated/server';
import { v } from 'convex/values';
import { requirePermission } from '../_lib/permissions';
import { withSchoolScope } from '../_lib/schoolContext';
import { Permission } from '../../src/lib/roles/types';
import { EduError, throwEduError } from '../_lib/errors';

/**
 * ISSUE-043 · Academic Calendar and School Events
 *
 * Tracks holidays, closures, exam periods, and custom events.
 * Feeds into the attendance system (holidays = no attendance required)
 * and the parent portal (parents see upcoming events).
 */

// ────────────────────────────────────────
// Mutations
// ────────────────────────────────────────

/** Create a new school event. */
export const createSchoolEvent = mutation({
  args: {
    academicYearId: v.id('academicYears'),
    termId: v.optional(v.id('terms')),
    title: v.string(),
    description: v.optional(v.string()),
    startDate: v.string(),
    endDate: v.string(),
    type: v.union(
      v.literal('holiday'),
      v.literal('exam_period'),
      v.literal('sports_day'),
      v.literal('school_closure'),
      v.literal('parent_teacher'),
      v.literal('general'),
    ),
    affectsAttendance: v.boolean(),
    visibleToParents: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.MANAGE_SCHOOL_SETTINGS);

    // Verify academic year belongs to this school
    const academicYear = await ctx.db.get(args.academicYearId);
    if (!academicYear || academicYear.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Academic year not found.');
    }

    // Validate date range
    if (args.startDate > args.endDate) {
      throwEduError(EduError.VALIDATION_ERROR, 'Start date must be before or equal to end date.');
    }

    const eventId = await ctx.db.insert('schoolEvents', {
      schoolId: school._id,
      academicYearId: args.academicYearId,
      termId: args.termId,
      title: args.title,
      description: args.description,
      startDate: args.startDate,
      endDate: args.endDate,
      type: args.type,
      affectsAttendance: args.affectsAttendance,
      visibleToParents: args.visibleToParents,
      createdAt: Date.now(),
    });

    return eventId;
  },
});

/** Update an existing school event. */
export const updateSchoolEvent = mutation({
  args: {
    eventId: v.id('schoolEvents'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    type: v.optional(
      v.union(
        v.literal('holiday'),
        v.literal('exam_period'),
        v.literal('sports_day'),
        v.literal('school_closure'),
        v.literal('parent_teacher'),
        v.literal('general'),
      ),
    ),
    affectsAttendance: v.optional(v.boolean()),
    visibleToParents: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.MANAGE_SCHOOL_SETTINGS);

    const event = await ctx.db.get(args.eventId);
    if (!event || event.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Event not found.');
    }

    // Build update object from args, excluding eventId
    const cleanUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(args)) {
      if (key !== 'eventId' && value !== undefined) {
        cleanUpdates[key] = value;
      }
    }

    await ctx.db.patch(args.eventId, cleanUpdates);
    return args.eventId;
  },
});

/** Delete a school event. */
export const deleteSchoolEvent = mutation({
  args: {
    eventId: v.id('schoolEvents'),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.MANAGE_SCHOOL_SETTINGS);

    const event = await ctx.db.get(args.eventId);
    if (!event || event.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Event not found.');
    }

    await ctx.db.delete(args.eventId);
  },
});

/**
 * Seed Zambia public holidays for a given academic year.
 * One-click import that populates the calendar with known holidays.
 */
export const seedZambiaHolidays = mutation({
  args: {
    academicYearId: v.id('academicYears'),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.MANAGE_SCHOOL_SETTINGS);

    const academicYear = await ctx.db.get(args.academicYearId);
    if (!academicYear || academicYear.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Academic year not found.');
    }

    const year = academicYear.year;
    const holidays = getZambiaHolidays(year);
    const now = Date.now();

    let count = 0;
    for (const holiday of holidays) {
      // Only insert holidays that fall within the academic year date range
      if (holiday.date >= academicYear.startDate && holiday.date <= academicYear.endDate) {
        await ctx.db.insert('schoolEvents', {
          schoolId: school._id,
          academicYearId: args.academicYearId,
          title: holiday.title,
          startDate: holiday.date,
          endDate: holiday.date,
          type: 'holiday',
          affectsAttendance: true,
          visibleToParents: true,
          createdAt: now,
        });
        count++;
      }
    }

    return { imported: count };
  },
});

// ────────────────────────────────────────
// Queries
// ────────────────────────────────────────

/**
 * Get events for a specific academic year.
 */
export const getEventsByYear = query({
  args: {
    academicYearId: v.id('academicYears'),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ ctx, schoolId }) => {
      const events = await ctx.db
        .query('schoolEvents')
        .withIndex('by_academic_year', (q) =>
          q.eq('schoolId', schoolId).eq('academicYearId', args.academicYearId),
        )
        .collect();

      return events.sort((a, b) => a.startDate.localeCompare(b.startDate));
    });
  },
});

/**
 * Get events within a date range. Used by attendance system to check school days.
 */
export const getEventsForDateRange = query({
  args: {
    startDate: v.string(),
    endDate: v.string(),
  },
  handler: async (ctx, args) => {
    return withSchoolScope(ctx, async ({ ctx, schoolId }) => {
      const allEvents = await ctx.db
        .query('schoolEvents')
        .withIndex('by_school', (q) => q.eq('schoolId', schoolId))
        .collect();

      // Filter to events that overlap with the requested date range
      return allEvents.filter(
        (event) => event.startDate <= args.endDate && event.endDate >= args.startDate,
      );
    });
  },
});

/**
 * Get upcoming events (next 30 days). Used by parent portal calendar widget.
 */
export const getUpcomingEvents = query({
  args: {},
  handler: async (ctx) => {
    return withSchoolScope(ctx, async ({ ctx, schoolId }) => {
      const today = new Date().toISOString().split('T')[0];
      const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      const allEvents = await ctx.db
        .query('schoolEvents')
        .withIndex('by_school', (q) => q.eq('schoolId', schoolId))
        .collect();

      return allEvents
        .filter(
          (event) =>
            event.visibleToParents && event.endDate >= today && event.startDate <= thirtyDaysLater,
        )
        .sort((a, b) => a.startDate.localeCompare(b.startDate));
    });
  },
});

// ────────────────────────────────────────
// Helpers
// ────────────────────────────────────────

/** Zambia public holidays generator by year. */
function getZambiaHolidays(year: number) {
  // Easter calculation (Anonymous Gregorian algorithm)
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  const easterDate = new Date(year, month - 1, day);
  const goodFriday = new Date(easterDate);
  goodFriday.setDate(easterDate.getDate() - 2);
  const holySaturday = new Date(easterDate);
  holySaturday.setDate(easterDate.getDate() - 1);
  const easterMonday = new Date(easterDate);
  easterMonday.setDate(easterDate.getDate() + 1);

  const toDateStr = (d: Date) => d.toISOString().split('T')[0];

  return [
    { title: "New Year's Day", date: `${year}-01-01` },
    { title: "International Women's Day", date: `${year}-03-08` },
    { title: 'Youth Day', date: `${year}-03-12` },
    { title: 'Good Friday', date: toDateStr(goodFriday) },
    { title: 'Holy Saturday', date: toDateStr(holySaturday) },
    { title: 'Easter Monday', date: toDateStr(easterMonday) },
    { title: 'Labour Day', date: `${year}-05-01` },
    { title: 'Africa Day', date: `${year}-05-25` },
    { title: "Heroes' Day", date: `${year}-07-07` },
    { title: 'Unity Day', date: `${year}-07-08` },
    { title: "Farmers' Day", date: `${year}-08-04` },
    { title: 'National Prayer Day', date: `${year}-10-18` },
    { title: 'Independence Day', date: `${year}-10-24` },
    { title: 'Christmas Day', date: `${year}-12-25` },
  ];
}
