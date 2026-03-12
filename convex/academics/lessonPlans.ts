import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { getAuthenticatedUserAndSchool } from '../_lib/schoolContext';
import { requireRole } from '../_lib/permissions';
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
    // Allow school/platform admins and all teaching roles to create lesson plans.
    const { school, user } = await requireRole(ctx, [
      'platform_admin',
      'school_admin',
      'deputy_head',
      'teacher',
      'class_teacher',
    ]);

    // Fetch the staff record for the author field (may be absent for admin-created plans).
    const staff = await ctx.db
      .query('staff')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();

    // Verify subjectId belongs to caller's school
    const subject = await ctx.db.get(args.subjectId);
    if (!subject || subject.schoolId !== school._id) {
      throwEduError(EduError.FORBIDDEN, 'Subject does not belong to your school.');
    }

    // Verify gradeId belongs to caller's school
    const grade = await ctx.db.get(args.gradeId);
    if (!grade || grade.schoolId !== school._id) {
      throwEduError(EduError.FORBIDDEN, 'Grade does not belong to your school.');
    }

    return await ctx.db.insert('lessonPlans', {
      schoolId: school._id,
      // staffId is undefined for admin-created plans that have no staff record.
      staffId: staff?.schoolId === school._id ? staff._id : undefined,
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

    const isAdmin = user.role === 'school_admin' || user.role === 'platform_admin';

    const staff = await ctx.db
      .query('staff')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();

    // Admins can edit any plan in their school; staff can only edit their own.
    const isOwner = staff && staff._id === plan.staffId;
    if (!isAdmin && !isOwner) {
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
    await getAuthenticatedUserAndSchool(ctx); // throws if unauthenticated
    return await ctx.storage.generateUploadUrl();
  },
});

export const getStorageUrls = query({
  args: { storageIds: v.array(v.id('_storage')) },
  handler: async (ctx, args) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    // Build a lookup set of the requested IDs for O(1) membership checks.
    const requestedSet = new Set<string>(args.storageIds);

    // Scope to this school via the index, then collect only the storage IDs we
    // care about in a single pass.  We intentionally skip adding a storageId
    // that isn't in requestedSet so the ownedStorageIds set stays small.
    const ownedStorageIds = new Set<string>();
    const plans = await ctx.db
      .query('lessonPlans')
      .withIndex('by_school', (q) => q.eq('schoolId', school._id))
      .collect();
    for (const plan of plans) {
      for (const resource of plan.resources) {
        if (resource.storageId && requestedSet.has(resource.storageId)) {
          ownedStorageIds.add(resource.storageId);
        }
      }
    }

    const urls = await Promise.all(
      args.storageIds.map(async (id) => {
        if (!ownedStorageIds.has(id)) return { storageId: id, url: null };
        const url = await ctx.storage.getUrl(id);
        return { storageId: id, url };
      }),
    );

    // Convert to a Record for convenient key-based lookups on the client
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

    // Filter visibility — mirror getPlanById draft protections
    return plans.filter((p) => {
      const isOwner = staff && p.staffId === staff._id;
      const isAdmin = user.role === 'school_admin' || user.role === 'platform_admin';
      // Owners and admins see everything
      if (isOwner || isAdmin) return true;
      // Non-owners can only see school-visible published plans
      return p.visibility === 'school' && p.status !== 'draft';
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
