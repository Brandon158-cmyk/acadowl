import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { getAuthenticatedUserAndSchool } from '../_lib/schoolContext';
import { requirePermission } from '../_lib/permissions';
import { Permission } from '../../src/lib/roles/types';
import { EduError, throwEduError } from '../_lib/errors';

// ── ISSUE-060 · Staff Attendance Register ──

/**
 * Mark attendance for multiple staff members in bulk.
 * Admin marks daily staff attendance.
 */
export const markBulkStaffAttendance = mutation({
  args: {
    date: v.string(),
    entries: v.array(
      v.object({
        staffId: v.id('staff'),
        status: v.union(
          v.literal('present'),
          v.literal('absent'),
          v.literal('on_leave'),
          v.literal('late'),
        ),
        leaveType: v.optional(
          v.union(
            v.literal('annual'),
            v.literal('sick'),
            v.literal('maternity_paternity'),
            v.literal('compassionate'),
            v.literal('unpaid'),
          ),
        ),
        notes: v.optional(v.string()),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { user, school } = await requirePermission(ctx, Permission.MANAGE_SCHOOL_SETTINGS);

    const results: string[] = [];

    for (const entry of args.entries) {
      // Validate staff belongs to this school
      const staff = await ctx.db.get(entry.staffId);
      if (!staff || staff.schoolId !== school._id) {
        continue; // Skip invalid entries silently
      }

      // Check if attendance already exists for this staff + date
      const existing = await ctx.db
        .query('staffAttendance')
        .withIndex('by_staff_date', (q) => q.eq('staffId', entry.staffId).eq('date', args.date))
        .first();

      if (existing) {
        // Update existing record
        await ctx.db.patch(existing._id, {
          status: entry.status,
          leaveType: entry.leaveType,
          notes: entry.notes,
          markedBy: user._id,
        });
        results.push(`Updated: ${staff.firstName} ${staff.lastName}`);
      } else {
        // Create new record
        await ctx.db.insert('staffAttendance', {
          schoolId: school._id,
          staffId: entry.staffId,
          date: args.date,
          status: entry.status,
          leaveType: entry.leaveType,
          notes: entry.notes,
          markedBy: user._id,
          createdAt: Date.now(),
        });
        results.push(`Marked: ${staff.firstName} ${staff.lastName}`);
      }
    }

    return { count: results.length, results };
  },
});

/**
 * Get staff attendance for a specific date.
 * Returns all staff with their attendance status for that day.
 */
export const getStaffAttendanceByDate = query({
  args: {
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    // Get all active staff
    const allStaff = await ctx.db
      .query('staff')
      .withIndex('by_school_status', (q) => q.eq('schoolId', school._id).eq('status', 'active'))
      .collect();

    // Get attendance records for this date
    const attendanceRecords = await ctx.db
      .query('staffAttendance')
      .withIndex('by_school_date', (q) => q.eq('schoolId', school._id).eq('date', args.date))
      .collect();

    const attendanceMap = new Map(attendanceRecords.map((r) => [r.staffId, r]));

    // Merge: every staff member with their attendance (or unmarked)
    const merged = allStaff.map((staff) => {
      const record = attendanceMap.get(staff._id);
      return {
        staffId: staff._id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        photoUrl: staff.photoUrl,
        jobTitle: staff.jobTitle,
        staffCategory: staff.staffCategory,
        status: record?.status ?? null,
        leaveType: record?.leaveType ?? null,
        notes: record?.notes ?? null,
        attendanceId: record?._id ?? null,
      };
    });

    return merged.sort((a, b) => a.lastName.localeCompare(b.lastName));
  },
});

/**
 * Get monthly staff attendance report.
 * Shows each staff's attendance record for a given month.
 */
export const getMonthlyStaffAttendance = query({
  args: {
    year: v.number(),
    month: v.number(), // 1-12
  },
  handler: async (ctx, args) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    // Build date range
    const startDate = `${args.year}-${String(args.month).padStart(2, '0')}-01`;
    const lastDay = new Date(args.year, args.month, 0).getDate();
    const endDate = `${args.year}-${String(args.month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    // Get all active staff
    const allStaff = await ctx.db
      .query('staff')
      .withIndex('by_school_status', (q) => q.eq('schoolId', school._id).eq('status', 'active'))
      .collect();

    // Get all attendance records for the month
    const allRecords = await ctx.db
      .query('staffAttendance')
      .withIndex('by_school', (q) => q.eq('schoolId', school._id))
      .filter((q) =>
        q.and(q.gte(q.field('date'), startDate), q.lte(q.field('date'), endDate)),
      )
      .collect();

    // Group by staff
    const recordsByStaff = new Map<string, typeof allRecords>();
    for (const record of allRecords) {
      const key = record.staffId;
      const existing = recordsByStaff.get(key) ?? [];
      existing.push(record);
      recordsByStaff.set(key, existing);
    }

    const report = allStaff.map((staff) => {
      const records = recordsByStaff.get(staff._id) ?? [];
      const presentDays = records.filter((r) => r.status === 'present').length;
      const absentDays = records.filter((r) => r.status === 'absent').length;
      const lateDays = records.filter((r) => r.status === 'late').length;
      const leaveDays = records.filter((r) => r.status === 'on_leave').length;

      return {
        staffId: staff._id,
        firstName: staff.firstName,
        lastName: staff.lastName,
        photoUrl: staff.photoUrl,
        jobTitle: staff.jobTitle,
        staffCategory: staff.staffCategory,
        presentDays,
        absentDays,
        lateDays,
        leaveDays,
        totalMarked: records.length,
        attendancePercent:
          records.length > 0 ? Math.round(((presentDays + lateDays) / records.length) * 100) : 0,
      };
    });

    return {
      month: args.month,
      year: args.year,
      startDate,
      endDate,
      totalSchoolDays: lastDay,
      staff: report.sort((a, b) => a.lastName.localeCompare(b.lastName)),
    };
  },
});

/**
 * Get attendance summary stats for today.
 */
export const getStaffAttendanceSummary = query({
  args: {
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    const totalStaff = await ctx.db
      .query('staff')
      .withIndex('by_school_status', (q) => q.eq('schoolId', school._id).eq('status', 'active'))
      .collect();

    const records = await ctx.db
      .query('staffAttendance')
      .withIndex('by_school_date', (q) => q.eq('schoolId', school._id).eq('date', args.date))
      .collect();

    const present = records.filter((r) => r.status === 'present').length;
    const absent = records.filter((r) => r.status === 'absent').length;
    const late = records.filter((r) => r.status === 'late').length;
    const onLeave = records.filter((r) => r.status === 'on_leave').length;
    const unmarked = totalStaff.length - records.length;

    return {
      totalStaff: totalStaff.length,
      present,
      absent,
      late,
      onLeave,
      unmarked,
      markedPercent:
        totalStaff.length > 0
          ? Math.round((records.length / totalStaff.length) * 100)
          : 0,
    };
  },
});
