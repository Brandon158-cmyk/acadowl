import { query, mutation } from '../_generated/server';
import { v } from 'convex/values';
import { withSchoolScope } from '../_lib/schoolContext';

/**
 * Notification query and mutation functions.
 */

/** Get notifications for the current user */
export const getMyNotifications = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, { limit }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query('users')
      .withIndex('tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();

    if (!user) return [];

    return ctx.db
      .query('notifications')
      .withIndex('by_recipient', (q) => q.eq('recipientUserId', user._id))
      .order('desc')
      .take(limit ?? 20);
  },
});

/** Get unread notification count */
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0;

    const user = await ctx.db
      .query('users')
      .withIndex('tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();

    if (!user) return 0;

    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_recipient', (q) => q.eq('recipientUserId', user._id))
      .collect();

    return notifications.filter((n) => !n.isRead).length;
  },
});

/** Mark a notification as read */
export const markAsRead = mutation({
  args: { notificationId: v.id('notifications') },
  handler: async (ctx, { notificationId }) => {
    await ctx.db.patch(notificationId, { isRead: true });
  },
});

/** Mark all notifications as read */
export const markAllAsRead = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return;

    const user = await ctx.db
      .query('users')
      .withIndex('tokenIdentifier', (q) => q.eq('tokenIdentifier', identity.tokenIdentifier))
      .unique();

    if (!user) return;

    const unread = await ctx.db
      .query('notifications')
      .withIndex('by_recipient', (q) => q.eq('recipientUserId', user._id))
      .collect();

    for (const n of unread) {
      if (!n.isRead) {
        await ctx.db.patch(n._id, { isRead: true });
      }
    }
  },
});
