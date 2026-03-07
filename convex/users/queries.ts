import { query } from '../_generated/server';
import { requireSchoolAdmin } from '../_lib/permissions';
import { Doc } from '../_generated/dataModel';

/**
 * User query functions.
 */

/** Get the current authenticated user with their linked profile and school */
export const getMe = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    // Primary lookup: search by tokenIdentifier
    let user = (await ctx.db
      .query('users')
      .withIndex('tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique()) as Doc<'users'> | null;

    // Fallback 1: Search by email from identity
    if (!user && identity.email) {
      user = (await ctx.db
        .query('users')
        .withIndex('email', (q) => q.eq('email', identity.email))
        .first()) as Doc<'users'> | null;
    }

    if (!user) return null;

    // Fetch linked profile
    let staffProfile = null;
    let guardianProfile = null;
    let studentProfile = null;
    let school = null;
    const guardianProfiles: any[] = [];

    if (user.staffId) {
      staffProfile = await ctx.db.get(user.staffId);
    }
    if (user.studentId) {
      studentProfile = await ctx.db.get(user.studentId);
    }
    if (user.schoolId) {
      school = await ctx.db.get(user.schoolId);
    }

    if (user.role === 'guardian' && user.phone) {
      // Find all guardian profiles across schools
      const guardians = await ctx.db
        .query('guardians')
        .withIndex('by_phone', (q) => q.eq('phone', user.phone!))
        .collect();

      if (guardians.length > 0) {
        guardianProfile = guardians[0]; // Set default for backward compatibility

        for (const g of guardians) {
          const children = await ctx.db
            .query('students')
            .withIndex('by_school', (q) => q.eq('schoolId', g.schoolId))
            .collect();

          const linkedChildren = children.filter((c) =>
            c.guardianLinks.some((link) => link.guardianId === g._id),
          );

          const gSchool = await ctx.db.get(g.schoolId);

          if (gSchool) {
            guardianProfiles.push({
              schoolId: g.schoolId,
              school: gSchool,
              guardianId: g._id,
              children: linkedChildren,
            });
          }
        }
      }
    } else if (user.guardianId) {
      // Fallback
      guardianProfile = await ctx.db.get(user.guardianId);
    }

    return {
      user,
      staff: staffProfile,
      guardian: guardianProfile,
      guardianProfiles,
      student: studentProfile,
      school,
    };
  },
});

/** Get all users for a school (admin use) */
export const getUsersBySchool = query({
  args: {},
  handler: async (ctx) => {
    const { school } = await requireSchoolAdmin(ctx);

    return ctx.db
      .query('users')
      .withIndex('by_school', (q) => q.eq('schoolId', school._id))
      .collect();
  },
});
