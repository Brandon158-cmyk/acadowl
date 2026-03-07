import { mutation } from './_generated/server';
import { v } from 'convex/values';
import { ConvexError } from 'convex/values';

/**
 * SECURE ELEVATION for Platform Admins.
 * This mutation is called AFTER the user has signed up/signed in.
 * It promotes the current authenticated user to platform_admin if the secret matches.
 */
export const elevateMyAccount = mutation({
  args: {
    adminSecret: v.string(),
    email: v.string(),
  },
  handler: async (ctx, args) => {
    // 1. Validate Secret
    const serverSecret = process.env.ADMIN_SIGNUP_SECRET;
    if (!serverSecret || args.adminSecret !== serverSecret) {
      throw new ConvexError('Invalid platform registration secret.');
    }

    // 2. Identify User to Elevate
    let user = await ctx.db
      .query('users')
      .withIndex('email', (q) => q.eq('email', args.email))
      .first();

    // Fallback: search by tokenIdentifier if email lookup fails
    if (!user) {
      const identity = await ctx.auth.getUserIdentity();
      if (identity) {
        user = await ctx.db
          .query('users')
          .withIndex('tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
          .unique();
      }
    }

    if (!user) {
      throw new ConvexError(
        `User record for ${args.email} not found. Please ensure sign-up succeeded.`,
      );
    }

    const identity = await ctx.auth.getUserIdentity();
    const tokenIdentifier = identity?.tokenIdentifier;

    console.info(
      `[elevateMyAccount] Elevating ${user.email} (${user._id}) to platform_admin. Token: ${tokenIdentifier}`,
    );

    // 3. Elevate
    await ctx.db.patch(user._id, {
      role: 'platform_admin',
      isActive: true,
      tokenIdentifier: tokenIdentifier,
      updatedAt: Date.now(),
    });

    const refreshed = await ctx.db.get(user._id);

    return {
      success: true,
      message: 'Successfully elevated to platform_administrator.',
      role: refreshed?.role,
    };
  },
});

/**
 * Emergency Cleanup
 * Deletes all users and accounts matching an email so they can start fresh.
 */
export const resetUserByEmail = mutation({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    // 1. Delete users
    const users = await ctx.db
      .query('users')
      .withIndex('email', (q) => q.eq('email', args.email))
      .collect();
    for (const u of users) {
      await ctx.db.delete(u._id);
    }

    // 2. Delete accounts
    const accounts = await ctx.db
      .query('authAccounts')
      .withIndex('providerAndAccountId', (q) =>
        q.eq('provider', 'password').eq('providerAccountId', args.email),
      )
      .collect();
    for (const a of accounts) {
      await ctx.db.delete(a._id);
    }

    return `Reset complete for ${args.email}. Deleted ${users.length} users and ${accounts.length} accounts.`;
  },
});
