import { query } from '../_generated/server';
import { getAuthenticatedUser } from '../_lib/schoolContext';

/**
 * User query functions.
 */

/** Get the current authenticated user with their linked profile and school */
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query('users')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();

    if (!user) return null;

    // Fetch linked profile
    let staffProfile = null;
    let guardianProfile = null;
    let studentProfile = null;
    let school = null;

    if (user.staffId) {
      staffProfile = await ctx.db.get(user.staffId);
    }
    if (user.guardianId) {
      guardianProfile = await ctx.db.get(user.guardianId);
    }
    if (user.studentId) {
      studentProfile = await ctx.db.get(user.studentId);
    }
    if (user.schoolId) {
      school = await ctx.db.get(user.schoolId);
    }

    return {
      user,
      staff: staffProfile,
      guardian: guardianProfile,
      student: studentProfile,
      school,
    };
  },
});

/** Get all users for a school (admin use) */
export const getUsersBySchool = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query('users')
      .withIndex('by_token', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();

    if (!user || !user.schoolId) return [];

    return ctx.db
      .query('users')
      .withIndex('by_school', (q) => q.eq('schoolId', user.schoolId!))
      .collect();
  },
});
