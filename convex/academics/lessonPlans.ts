import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { getAuthenticatedUserAndSchool } from '../_lib/schoolContext';
import { EduError, throwEduError } from '../_lib/errors';
import { Doc } from '../_generated/dataModel';

export const createPlan = mutation({
  args: {
    subjectId: v.id('subjects'),
    gradeId: v.id('grades'),
    title: v.string(),
    content: v.optional(v.string()),
    status: v.union(v.literal('draft'), v.literal('published')),
    syllabusTopicRef: v.optional(v.string()),
    learningObjectives: v.array(v.string()),
    duration: v.optional(v.number()),
    resources: v.array(
      v.object({
        type: v.union(v.literal('pdf'), v.literal('link'), v.literal('text')),
        title: v.string(),
        url: v.optional(v.string()),
        storageId: v.optional(v.id('_storage')),
        content: v.optional(v.string()),
      }),
    ),
    visibility: v.union(v.literal('private'), v.literal('school')),
  },
  handler: async (ctx, args) => {
    const { school, user } = await getAuthenticatedUserAndSchool(ctx);

    const staff = await ctx.db
      .query('staff')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();

    if (!staff || staff.schoolId !== school._id) {
      throwEduError(EduError.FORBIDDEN, 'Only teaching staff can create lesson plans.');
    }

    return await ctx.db.insert('lessonPlans', {
      schoolId: school._id,
      staffId: staff._id,
      subjectId: args.subjectId,
      gradeId: args.gradeId,
      title: args.title,
      content: args.content,
      status: args.status,
      syllabusTopicRef: args.syllabusTopicRef,
      learningObjectives: args.learningObjectives,
      duration: args.duration,
      resources: args.resources,
      visibility: args.visibility,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const updatePlan = mutation({
  args: {
    id: v.id('lessonPlans'),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    status: v.optional(v.union(v.literal('draft'), v.literal('published'))),
    syllabusTopicRef: v.optional(v.string()),
    learningObjectives: v.optional(v.array(v.string())),
    duration: v.optional(v.number()),
    resources: v.optional(
      v.array(
        v.object({
          type: v.union(v.literal('pdf'), v.literal('link'), v.literal('text')),
          title: v.string(),
          url: v.optional(v.string()),
          storageId: v.optional(v.id('_storage')),
          content: v.optional(v.string()),
        }),
      ),
    ),
    visibility: v.optional(v.union(v.literal('private'), v.literal('school'))),
  },
  handler: async (ctx, args) => {
    const { school, user } = await getAuthenticatedUserAndSchool(ctx);

    const plan = await ctx.db.get(args.id);
    if (!plan || plan.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Lesson plan not found.');
    }

    const staff = await ctx.db
      .query('staff')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();

    if (!staff || staff._id !== plan.staffId) {
      // Must be owner to edit
      throwEduError(EduError.FORBIDDEN, 'You do not have permission to edit this lesson plan.');
    }

    const updates: Partial<Doc<'lessonPlans'>> = {};
    if (args.title !== undefined) updates.title = args.title;
    if (args.content !== undefined) updates.content = args.content;
    if (args.status !== undefined) updates.status = args.status;
    if (args.syllabusTopicRef !== undefined) updates.syllabusTopicRef = args.syllabusTopicRef;
    if (args.learningObjectives !== undefined) updates.learningObjectives = args.learningObjectives;
    if (args.duration !== undefined) updates.duration = args.duration;
    if (args.resources !== undefined) updates.resources = args.resources;
    if (args.visibility !== undefined) updates.visibility = args.visibility;
    updates.updatedAt = Date.now();

    await ctx.db.patch(args.id, updates);
  },
});

export const getPlanById = query({
  args: { id: v.id('lessonPlans') },
  handler: async (ctx, args) => {
    const { school, user } = await getAuthenticatedUserAndSchool(ctx);
    const plan = await ctx.db.get(args.id);
    if (!plan || plan.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Lesson plan not found.');
    }

    // Check if user is staff
    const staff = await ctx.db
      .query('staff')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();

    // Permissions: owner can see draft and published
    // Others can only see if published and visibility is school (or admin)
    const isOwner = staff && staff._id === plan.staffId;
    const isAdmin = user.role === 'school_admin' || user.role === 'platform_admin';

    if (!isOwner && !isAdmin) {
      if (plan.status !== 'published') {
        throwEduError(EduError.FORBIDDEN, 'You do not have permission to view this draft.');
      }
      if (plan.visibility !== 'school') {
        throwEduError(EduError.FORBIDDEN, 'You do not have permission to view this private plan.');
      }
    }

    return plan;
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);
    if (!school) throwEduError(EduError.UNAUTHENTICATED, 'Unauthorized');
    return await ctx.storage.generateUploadUrl();
  },
});

export const getStorageUrls = query({
  args: { storageIds: v.array(v.id('_storage')) },
  handler: async (ctx, args) => {
    // Only authenticated users can get these URLs for now
    await getAuthenticatedUserAndSchool(ctx);

    const urls = await Promise.all(
      args.storageIds.map(async (id) => {
        const url = await ctx.storage.getUrl(id);
        return { storageId: id, url };
      }),
    );

    // Convert array of objects to Map-like object
    return urls.reduce(
      (acc, curr) => {
        acc[curr.storageId] = curr.url;
        return acc;
      },
      {} as Record<string, string | null>,
    );
  },
});

export const getPlansBySubject = query({
  args: {
    subjectId: v.id('subjects'),
    gradeId: v.id('grades'),
  },
  handler: async (ctx, args) => {
    const { school, user } = await getAuthenticatedUserAndSchool(ctx);

    // If teacher, they can see their own + school level plans for this subject/grade
    const staff = await ctx.db
      .query('staff')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();

    const plans = await ctx.db
      .query('lessonPlans')
      .withIndex('by_subject_grade', (q) =>
        q.eq('subjectId', args.subjectId).eq('gradeId', args.gradeId),
      )
      .filter((q) => q.eq(q.field('schoolId'), school._id))
      .collect();

    // Filter visibility
    return plans.filter((p) => {
      // If it's your plan, see it always
      if (staff && p.staffId === staff._id) return true;
      // If visibility is school, see it
      if (p.visibility === 'school') return true;
      // If admin and visibility is school (already handled). Admins can also see private? Let's say yes for moderation
      if (user.role === 'school_admin' || user.role === 'platform_admin') return true;
      return false;
    });
  },
});

export const getPlansByStaff = query({
  args: {},
  handler: async (ctx) => {
    const { school, user } = await getAuthenticatedUserAndSchool(ctx);

    const staff = await ctx.db
      .query('staff')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();

    if (!staff || staff.schoolId !== school._id) {
      // Admin might call this, return empty or throw? Better just return empty if not staff.
      return [];
    }

    return await ctx.db
      .query('lessonPlans')
      .withIndex('by_staff', (q) => q.eq('staffId', staff._id))
      .collect();
  },
});
