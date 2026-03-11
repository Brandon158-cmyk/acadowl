import { v } from 'convex/values';
import { mutation } from '../_generated/server';
import { getAuthenticatedUserAndSchool, getAuthenticatedUser } from '../_lib/schoolContext';
import { requireRole, requireSchoolAdmin } from '../_lib/permissions';
import { EduError, throwEduError } from '../_lib/errors';

/**
 * ISSUE-015 · resolveUserProfile
 *
 * Called after every successful login.
 * Auto-links user to their staff/guardian/student profile by phone/email.
 */
export const resolveUserProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query('users')
      .withIndex('tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();

    if (!user) return null;

    // Update last login
    await ctx.db.patch(user._id, { lastLoginAt: Date.now() });

    // Skip if already linked
    if (user.staffId || user.guardianId || user.studentId) {
      return { user, alreadyLinked: true };
    }

    // If user has a school, try to auto-link
    if (user.schoolId) {
      // Try staff match by email
      if (user.email) {
        const staff = await ctx.db
          .query('staff')
          .withIndex('by_school', (q) => q.eq('schoolId', user.schoolId!))
          .filter((q) => q.eq(q.field('email'), user.email))
          .first();

        if (staff) {
          await ctx.db.patch(user._id, {
            staffId: staff._id,
            role: staff.staffCategory === 'admin' ? 'school_admin' : 'teacher',
          });
          return { user: await ctx.db.get(user._id), linked: 'staff' };
        }
      }

      // Try guardian match by phone across all schools (ISSUE-031)
      if (user.phone) {
        const guardians = await ctx.db
          .query('guardians')
          .withIndex('by_phone', (q) => q.eq('phone', user.phone!))
          .collect();

        if (guardians.length > 0) {
          // Link first found guardian to the user record for legacy compatibility
          await ctx.db.patch(user._id, {
            guardianId: guardians[0]._id,
            role: 'guardian',
          });

          // Ensure all matching guardian records point to this userId
          for (const g of guardians) {
            if (g.userId !== user._id) {
              await ctx.db.patch(g._id, { userId: user._id });
            }
          }
          return { user: await ctx.db.get(user._id), linked: 'guardian' };
        }
      }
    }

    return { user, linked: null };
  },
});

/**
 * ISSUE-030 · createUser
 *
 * School admin creates a new user account for staff.
 */
export const createUser = mutation({
  args: {
    firstName: v.string(),
    lastName: v.string(),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
    role: v.union(
      v.literal('school_admin'),
      v.literal('deputy_head'),
      v.literal('bursar'),
      v.literal('teacher'),
      v.literal('class_teacher'),
      v.literal('matron'),
      v.literal('librarian'),
      v.literal('driver'),
    ),
  },
  handler: async (ctx, args) => {
    const { user, school } = await requireSchoolAdmin(ctx);

    // Check for duplicate phone/email in this school
    if (args.email) {
      const existing = await ctx.db
        .query('users')
        .withIndex('email', (q) => q.eq('email', args.email!))
        .first();
      if (existing && existing.schoolId === school._id) {
        throwEduError(EduError.ALREADY_EXISTS, 'A user with this email already exists.');
      }
    }

    const now = Date.now();

    const userId = await ctx.db.insert('users', {
      schoolId: school._id,
      name: `${args.firstName} ${args.lastName}`,
      phone: args.phone,
      email: args.email,
      role: args.role,
      isActive: true,
      isFirstLogin: true,
      createdAt: now,
      updatedAt: now,
    });

    return userId;
  },
});

/**
 * ISSUE-030 · updateUserRole
 */
export const updateUserRole = mutation({
  args: {
    userId: v.id('users'),
    role: v.union(
      v.literal('school_admin'),
      v.literal('deputy_head'),
      v.literal('bursar'),
      v.literal('teacher'),
      v.literal('class_teacher'),
      v.literal('matron'),
      v.literal('librarian'),
      v.literal('driver'),
      v.literal('guardian'),
    ),
  },
  handler: async (ctx, args) => {
    const { school } = await requireSchoolAdmin(ctx);

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser || targetUser.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'User not found.');
    }

    await ctx.db.patch(args.userId, {
      role: args.role,
      updatedAt: Date.now(),
    });
  },
});

/**
 * ISSUE-030 · deactivateUser
 */
export const deactivateUser = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const { school } = await requireSchoolAdmin(ctx);

    const targetUser = await ctx.db.get(args.userId);
    if (!targetUser || targetUser.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'User not found.');
    }

    await ctx.db.patch(args.userId, {
      isActive: false,
      updatedAt: Date.now(),
    });
  },
});
