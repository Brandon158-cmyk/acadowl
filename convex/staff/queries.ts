import { v } from 'convex/values';
import { query } from '../_generated/server';
import { getAuthenticatedUserAndSchool } from '../_lib/schoolContext';
import { requirePermission } from '../_lib/permissions';
import { Permission } from '../../src/lib/roles/types';
import { EduError, throwEduError } from '../_lib/errors';

// ── Staff Directory Queries ──

/**
 * Get all staff members for the current school.
 * Enriched with section and subject counts.
 */
export const getAllStaff = query({
  args: {
    status: v.optional(
      v.union(v.literal('active'), v.literal('on_leave'), v.literal('terminated')),
    ),
    category: v.optional(
      v.union(v.literal('teaching'), v.literal('non_teaching'), v.literal('admin')),
    ),
  },
  handler: async (ctx, args) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    let staffList;

    if (args.status) {
      staffList = await ctx.db
        .query('staff')
        .withIndex('by_school_status', (q) =>
          q.eq('schoolId', school._id).eq('status', args.status!),
        )
        .collect();
    } else {
      staffList = await ctx.db
        .query('staff')
        .withIndex('by_school', (q) => q.eq('schoolId', school._id))
        .collect();
    }

    // Filter by category if provided
    if (args.category) {
      staffList = staffList.filter((s) => s.staffCategory === args.category);
    }

    // Enrich with class section name if assigned
    const enriched = await Promise.all(
      staffList.map(async (staff) => {
        let classSectionName: string | null = null;
        if (staff.classSectionId) {
          const section = await ctx.db.get(staff.classSectionId);
          classSectionName = section?.displayName ?? null;
        }
        return {
          ...staff,
          classSectionName,
          subjectCount: staff.subjectIds.length,
          sectionCount: staff.sectionIds.length,
        };
      }),
    );

    return enriched.sort((a, b) => a.lastName.localeCompare(b.lastName));
  },
});

/**
 * Get a single staff member by ID.
 */
export const getStaffById = query({
  args: {
    staffId: v.id('staff'),
  },
  handler: async (ctx, args) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    const staff = await ctx.db.get(args.staffId);
    if (!staff || staff.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Staff member not found.');
    }

    // Enrich with class section and subject names
    let classSectionName: string | null = null;
    if (staff!.classSectionId) {
      const section = await ctx.db.get(staff!.classSectionId);
      classSectionName = section?.displayName ?? null;
    }

    const subjects = await Promise.all(
      staff!.subjectIds.map(async (id) => {
        const subject = await ctx.db.get(id);
        return subject ? { _id: subject._id, name: subject.name, code: subject.code } : null;
      }),
    );

    return {
      ...staff,
      classSectionName,
      subjects: subjects.filter(Boolean),
    };
  },
});
