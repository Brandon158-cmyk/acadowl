import { query } from '../_generated/server';
import { v } from 'convex/values';

/**
 * School query functions.
 */

/** Get a school by its URL slug */
export const getSchoolBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return ctx.db
      .query('schools')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .unique();
  },
});

/** Get a school by its ID */
export const getSchoolById = query({
  args: { schoolId: v.id('schools') },
  handler: async (ctx, { schoolId }) => {
    return ctx.db.get(schoolId);
  },
});
