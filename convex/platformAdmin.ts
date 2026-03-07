import { mutation } from './_generated/server';
import { v, ConvexError } from 'convex/values';
import { Doc, Id } from './_generated/dataModel';

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

    // 2. Identify the Authenticated Identity
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      throw new ConvexError('State error: Not authenticated. Please sign up first.');
    }

    const currentUserId = identity.subject as Id<'users'>;
    const currentUser = (await ctx.db.get(currentUserId)) as Doc<'users'> | null;

    if (!currentUser) {
      throw new ConvexError(
        'Critical Error: Authenticated user record not found. Please try signing out and in again.',
      );
    }

    console.info(
      `[elevateMyAccount] Elevating current session user: ${currentUser.email} (${currentUserId})`,
    );

    // 3. Handle Identity Merging (Find any legacy users with the same email)
    const targetEmail = args.email.toLowerCase();
    const otherUsers = (await ctx.db
      .query('users')
      .withIndex('email', (q) => q.eq('email', targetEmail))
      .collect()) as Doc<'users'>[];

    // Mark all matching email records (including current and legacy) as admins
    for (const u of otherUsers) {
      console.info(`[elevateMyAccount] Patching role for record: ${u._id}`);
      await ctx.db.patch(u._id, {
        role: 'platform_admin',
        isActive: true,
        tokenIdentifier: identity.tokenIdentifier,
        email: targetEmail, // Ensure email is correctly case-normalized
        updatedAt: Date.now(),
      });
    }

    // Double check that the current session identity itself is now elevated
    await ctx.db.patch(currentUserId, {
      role: 'platform_admin',
      isActive: true,
      tokenIdentifier: identity.tokenIdentifier,
      email: targetEmail,
      updatedAt: Date.now(),
    });

    const refreshed = await ctx.db.get(currentUserId);

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
