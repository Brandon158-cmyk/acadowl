import { query } from './_generated/server';

export const listAuthState = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query('users').collect();
    const accounts = await ctx.db.query('authAccounts').collect();
    const sessions = await ctx.db.query('authSessions').collect();

    return {
      users: users.map((u: any) => ({
        id: u._id,
        email: u.email,
        token: u.tokenIdentifier,
        role: u.role,
      })),
      accounts,
      sessions,
    };
  },
});
