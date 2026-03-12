import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import { requireRole } from '../_lib/permissions';
import { getAuthenticatedUserAndSchool } from '../_lib/schoolContext';
import { EduError, throwEduError } from '../_lib/errors';

/** Roles allowed to create/edit/delete homework and generate upload URLs. */
const HOMEWORK_WRITE_ROLES = [
  'platform_admin',
  'school_admin',
  'deputy_head',
  'teacher',
  'class_teacher',
] as const;

export const createHomework = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    subjectId: v.id('subjects'),
    gradeId: v.id('grades'),
    dueDate: v.number(),
    totalPoints: v.optional(v.number()),
    status: v.union(v.literal('draft'), v.literal('published'), v.literal('closed')),
    resources: v.optional(
      v.array(
        v.object({
          title: v.string(),
          type: v.union(v.literal('pdf'), v.literal('link'), v.literal('text'), v.literal('file')),
          url: v.optional(v.string()),
          storageId: v.optional(v.id('_storage')),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    // Only staff/admin roles may create homework
    const { school } = await requireRole(ctx, [...HOMEWORK_WRITE_ROLES]);

    // Verify subjectId belongs to caller's school
    const subject = await ctx.db.get(args.subjectId);
    if (!subject || subject.schoolId !== school._id) {
      throwEduError(EduError.FORBIDDEN, 'Subject does not belong to your school.');
    }

    // Verify subject is active for the requested grade
    if (!subject!.gradeIds.includes(args.gradeId)) {
      throwEduError(EduError.FORBIDDEN, 'Subject is not active for the selected grade.');
    }

    // Verify gradeId belongs to caller's school
    const grade = await ctx.db.get(args.gradeId);
    if (!grade || grade.schoolId !== school._id) {
      throwEduError(EduError.FORBIDDEN, 'Grade does not belong to your school.');
    }

    return await ctx.db.insert('homework', {
      ...args,
      schoolId: school._id,
    });
  },
});

export const updateHomework = mutation({
  args: {
    id: v.id('homework'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    subjectId: v.optional(v.id('subjects')),
    gradeId: v.optional(v.id('grades')),
    dueDate: v.optional(v.number()),
    totalPoints: v.optional(v.number()),
    status: v.optional(v.union(v.literal('draft'), v.literal('published'), v.literal('closed'))),
    resources: v.optional(
      v.array(
        v.object({
          title: v.string(),
          type: v.union(v.literal('pdf'), v.literal('link'), v.literal('text'), v.literal('file')),
          url: v.optional(v.string()),
          storageId: v.optional(v.id('_storage')),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    // Only staff/admin roles may update homework
    const { school } = await requireRole(ctx, [...HOMEWORK_WRITE_ROLES]);

    const existing = await ctx.db.get(args.id);
    if (!existing || existing.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Homework not found.');
    }

    // Determine effective subjectId and gradeId (updated or unchanged)
    const effectiveSubjectId = args.subjectId ?? existing!.subjectId;
    const effectiveGradeId = args.gradeId ?? existing!.gradeId;

    // Re-validate subject/grade whenever either changes
    if (args.subjectId !== undefined || args.gradeId !== undefined) {
      const subject = await ctx.db.get(effectiveSubjectId);
      if (!subject || subject.schoolId !== school._id) {
        throwEduError(EduError.FORBIDDEN, 'Subject does not belong to your school.');
      }

      if (!subject!.gradeIds.includes(effectiveGradeId)) {
        throwEduError(EduError.FORBIDDEN, 'Subject is not active for the selected grade.');
      }

      const grade = await ctx.db.get(effectiveGradeId);
      if (!grade || grade.schoolId !== school._id) {
        throwEduError(EduError.FORBIDDEN, 'Grade does not belong to your school.');
      }
    }

    const { id, ...updates } = args;
    await ctx.db.patch(id, updates);
  },
});

export const deleteHomework = mutation({
  args: { id: v.id('homework') },
  handler: async (ctx, args) => {
    // Only staff/admin roles may delete homework
    const { school } = await requireRole(ctx, [...HOMEWORK_WRITE_ROLES]);

    const existing = await ctx.db.get(args.id);
    if (!existing || existing.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Homework not found.');
    }

    // Batched paginated delete of associated submissions to stay within Convex limits
    let hasMore = true;
    while (hasMore) {
      const batch = await ctx.db
        .query('homeworkSubmissions')
        .withIndex('by_homework', (q) => q.eq('homeworkId', args.id))
        .take(100);

      for (const sub of batch) {
        await ctx.db.delete(sub._id);
      }

      hasMore = batch.length === 100;
    }

    // Delete homework record
    await ctx.db.delete(args.id);
  },
});

export const getHomeworkList = query({
  args: {
    gradeId: v.optional(v.id('grades')),
    subjectId: v.optional(v.id('subjects')),
  },
  handler: async (ctx, args) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    let homeworkList;
    if (args.subjectId && args.gradeId) {
      // Both filters: query by subject index then post-filter by gradeId
      const bySubject = await ctx.db
        .query('homework')
        .withIndex('by_subject', (q) => q.eq('subjectId', args.subjectId!))
        .collect();
      homeworkList = bySubject.filter(
        (hw) => hw.gradeId === args.gradeId && hw.schoolId === school._id,
      );
    } else if (args.subjectId) {
      homeworkList = await ctx.db
        .query('homework')
        .withIndex('by_subject', (q) => q.eq('subjectId', args.subjectId!))
        .filter((q) => q.eq(q.field('schoolId'), school._id))
        .collect();
    } else if (args.gradeId) {
      homeworkList = await ctx.db
        .query('homework')
        .withIndex('by_grade', (q) => q.eq('gradeId', args.gradeId!))
        .filter((q) => q.eq(q.field('schoolId'), school._id))
        .collect();
    } else {
      homeworkList = await ctx.db
        .query('homework')
        .withIndex('by_school', (q) => q.eq('schoolId', school._id))
        .order('desc')
        .collect();
    }

    // Map relationships manually for display
    return await Promise.all(
      homeworkList.map(async (hw) => {
        const subject = await ctx.db.get(hw.subjectId);
        const grade = await ctx.db.get(hw.gradeId);

        let resourceUrls: Array<{
          title: string;
          type: string;
          url?: string | null;
          storageId?: Id<'_storage'>;
        }> = [];
        if (hw.resources) {
          resourceUrls = await Promise.all(
            hw.resources.map(async (res) => {
              if (res.storageId) {
                return { ...res, url: await ctx.storage.getUrl(res.storageId) };
              }
              return res;
            }),
          );
        }

        return {
          ...hw,
          subjectName: subject?.name || 'Unknown Subject',
          gradeName: grade?.name || 'Unknown Grade',
          resources: resourceUrls,
        };
      }),
    );
  },
});

export const getHomeworkById = query({
  args: { id: v.id('homework') },
  handler: async (ctx, args) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);
    const homework = await ctx.db.get(args.id);
    if (!homework || homework.schoolId !== school._id) return null;

    let resourceUrls: Array<{
      title: string;
      type: string;
      url?: string | null;
      storageId?: Id<'_storage'>;
    }> = [];
    if (homework.resources) {
      resourceUrls = await Promise.all(
        homework.resources.map(async (res) => {
          if (res.storageId) {
            return { ...res, url: await ctx.storage.getUrl(res.storageId) };
          }
          return res;
        }),
      );
    }

    return { ...homework, resources: resourceUrls };
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    // Only staff/admin roles may generate homework upload URLs
    await requireRole(ctx, [...HOMEWORK_WRITE_ROLES]);
    return await ctx.storage.generateUploadUrl();
  },
});
