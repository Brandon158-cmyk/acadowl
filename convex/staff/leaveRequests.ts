import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { getAuthenticatedUserAndSchool } from '../_lib/schoolContext';
import { requirePermission } from '../_lib/permissions';
import { Permission } from '../../src/lib/roles/types';
import { EduError, throwEduError } from '../_lib/errors';

// ── ISSUE-061 · Leave Management ──

/**
 * Submit a leave request.
 * Staff can submit leave requests from their profile.
 */
export const submitLeaveRequest = mutation({
  args: {
    staffId: v.id('staff'),
    leaveType: v.union(
      v.literal('annual'),
      v.literal('sick'),
      v.literal('maternity_paternity'),
      v.literal('compassionate'),
      v.literal('unpaid'),
    ),
    startDate: v.string(),
    endDate: v.string(),
    reason: v.string(),
  },
  handler: async (ctx, args) => {
    const { user, school } = await getAuthenticatedUserAndSchool(ctx);

    // Validate staff belongs to this school
    const staff = await ctx.db.get(args.staffId);
    if (!staff || staff.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Staff member not found.');
    }

    // Only the staff member themselves or an admin can submit a leave request
    const isOwnRequest = user.staffId === args.staffId;
    const isAdmin = user.role === 'school_admin' || user.role === 'platform_admin';
    if (!isOwnRequest && !isAdmin) {
      throwEduError(EduError.FORBIDDEN, 'You can only submit leave requests for yourself.');
    }

    // Calculate days requested (inclusive of start and end)
    const start = new Date(args.startDate);
    const end = new Date(args.endDate);
    if (end < start) {
      throwEduError(EduError.VALIDATION_ERROR, 'End date must be on or after start date.');
    }
    const diffMs = end.getTime() - start.getTime();
    const daysRequested = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;

    // Check for overlapping leave requests (pending or approved)
    const existingRequests = await ctx.db
      .query('leaveRequests')
      .withIndex('by_staff', (q) => q.eq('staffId', args.staffId))
      .filter((q) =>
        q.and(
          q.neq(q.field('status'), 'rejected'),
          q.lte(q.field('startDate'), args.endDate),
          q.gte(q.field('endDate'), args.startDate),
        ),
      )
      .first();

    if (existingRequests) {
      throwEduError(
        EduError.CONFLICT,
        'An existing leave request overlaps with these dates. Please adjust your dates or cancel the existing request.',
      );
    }

    const requestId = await ctx.db.insert('leaveRequests', {
      schoolId: school._id,
      staffId: args.staffId,
      leaveType: args.leaveType,
      startDate: args.startDate,
      endDate: args.endDate,
      daysRequested,
      reason: args.reason,
      status: 'pending',
      submittedAt: Date.now(),
    });

    return requestId;
  },
});

/**
 * Approve or reject a leave request.
 * On approval, auto-creates staffAttendance records for the leave period.
 */
export const respondToLeaveRequest = mutation({
  args: {
    requestId: v.id('leaveRequests'),
    action: v.union(v.literal('approved'), v.literal('rejected')),
    responseNote: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user, school } = await requirePermission(ctx, Permission.MANAGE_SCHOOL_SETTINGS);

    const request = await ctx.db.get(args.requestId);
    if (!request || request.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Leave request not found.');
    }

    if (request!.status !== 'pending') {
      throwEduError(
        EduError.CONFLICT,
        `This leave request has already been ${request!.status}.`,
      );
    }

    // Update the request status
    await ctx.db.patch(args.requestId, {
      status: args.action,
      approvedBy: user._id,
      responseNote: args.responseNote,
      respondedAt: Date.now(),
    });

    // On approval, auto-create staffAttendance records for the leave period
    if (args.action === 'approved') {
      const start = new Date(request!.startDate);
      const end = new Date(request!.endDate);

      const current = new Date(start);
      while (current <= end) {
        const dateStr = current.toISOString().split('T')[0];

        // Check if attendance already exists for this date
        const existing = await ctx.db
          .query('staffAttendance')
          .withIndex('by_staff_date', (q) =>
            q.eq('staffId', request!.staffId).eq('date', dateStr),
          )
          .first();

        if (existing) {
          // Update existing to on_leave
          await ctx.db.patch(existing._id, {
            status: 'on_leave',
            leaveType: request!.leaveType,
            notes: `Leave approved: ${request!.reason}`,
            markedBy: user._id,
          });
        } else {
          await ctx.db.insert('staffAttendance', {
            schoolId: school._id,
            staffId: request!.staffId,
            date: dateStr,
            status: 'on_leave',
            leaveType: request!.leaveType,
            notes: `Leave approved: ${request!.reason}`,
            markedBy: user._id,
            createdAt: Date.now(),
          });
        }

        current.setDate(current.getDate() + 1);
      }
    }
  },
});

/**
 * Get leave requests for a staff member.
 */
export const getLeaveRequestsForStaff = query({
  args: {
    staffId: v.id('staff'),
  },
  handler: async (ctx, args) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    const staff = await ctx.db.get(args.staffId);
    if (!staff || staff.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Staff member not found.');
    }

    const requests = await ctx.db
      .query('leaveRequests')
      .withIndex('by_staff', (q) => q.eq('staffId', args.staffId))
      .collect();

    // Enrich with approver name
    const enriched = await Promise.all(
      requests.map(async (r) => {
        let approverName: string | null = null;
        if (r.approvedBy) {
          const approver = await ctx.db.get(r.approvedBy);
          approverName = approver?.name ?? null;
        }
        return { ...r, approverName };
      }),
    );

    return enriched.sort((a, b) => b.submittedAt - a.submittedAt);
  },
});

/**
 * Get all pending leave requests for the school (admin view).
 */
export const getPendingLeaveRequests = query({
  args: {},
  handler: async (ctx) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    const requests = await ctx.db
      .query('leaveRequests')
      .withIndex('by_school_status', (q) =>
        q.eq('schoolId', school._id).eq('status', 'pending'),
      )
      .collect();

    // Enrich with staff name
    const enriched = await Promise.all(
      requests.map(async (r) => {
        const staff = await ctx.db.get(r.staffId);
        return {
          ...r,
          staffFirstName: staff?.firstName ?? 'Unknown',
          staffLastName: staff?.lastName ?? 'Unknown',
          staffPhotoUrl: staff?.photoUrl,
          staffJobTitle: staff?.jobTitle ?? '',
        };
      }),
    );

    return enriched.sort((a, b) => a.submittedAt - b.submittedAt);
  },
});

/**
 * Get all leave requests for the school (all statuses).
 */
export const getAllLeaveRequests = query({
  args: {
    status: v.optional(
      v.union(v.literal('pending'), v.literal('approved'), v.literal('rejected')),
    ),
  },
  handler: async (ctx, args) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    let requests;
    if (args.status) {
      requests = await ctx.db
        .query('leaveRequests')
        .withIndex('by_school_status', (q) =>
          q.eq('schoolId', school._id).eq('status', args.status!),
        )
        .collect();
    } else {
      requests = await ctx.db
        .query('leaveRequests')
        .withIndex('by_school', (q) => q.eq('schoolId', school._id))
        .collect();
    }

    // Enrich with staff name
    const enriched = await Promise.all(
      requests.map(async (r) => {
        const staff = await ctx.db.get(r.staffId);
        let approverName: string | null = null;
        if (r.approvedBy) {
          const approver = await ctx.db.get(r.approvedBy);
          approverName = approver?.name ?? null;
        }
        return {
          ...r,
          staffFirstName: staff?.firstName ?? 'Unknown',
          staffLastName: staff?.lastName ?? 'Unknown',
          staffPhotoUrl: staff?.photoUrl,
          staffJobTitle: staff?.jobTitle ?? '',
          approverName,
        };
      }),
    );

    return enriched.sort((a, b) => b.submittedAt - a.submittedAt);
  },
});
