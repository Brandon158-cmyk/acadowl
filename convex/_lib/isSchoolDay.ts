import { QueryCtx } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import { isSchoolDayPure } from '../schools/validation';

/**
 * isSchoolDay utility
 *
 * Checks if a given date is a school day (not a weekend, not a holiday/closure).
 * Used by the attendance system (Sprint 01 Epic 7) to determine
 * whether attendance is expected on a given date.
 */
export async function isSchoolDay(
  ctx: QueryCtx,
  schoolId: Id<'schools'>,
  date: string,
): Promise<boolean> {
  // Check school events that affect attendance on this date
  const events = await ctx.db
    .query('schoolEvents')
    .withIndex('by_school', (q) => q.eq('schoolId', schoolId))
    .collect();

  return isSchoolDayPure(date, events);
}
