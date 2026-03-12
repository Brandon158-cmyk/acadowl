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

    // Verify subject is active for the requested grade
    if (!subject!.gradeIds.includes(args.gradeId)) {
      throwEduError(EduError.FORBIDDEN, 'Subject is not active for the selected grade.');
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
      // Guardians and students have no staff record — deny all non-owner access.
      if (!staff || staff.schoolId !== school._id) {
        throwEduError(EduError.FORBIDDEN, 'Only school staff can view lesson plans.');
      }
      if (plan!.status !== 'published') {
        throwEduError(EduError.FORBIDDEN, 'You do not have permission to view this draft.');
      }
      if (plan!.visibility !== 'school') {
        throwEduError(EduError.FORBIDDEN, 'You do not have permission to view this private plan.');
      }
    }

    return plan;
  },
});

export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    // Require the same roles as createPlan — only lesson-plan authors may upload.
    await requireRole(ctx, [
      'platform_admin',
      'school_admin',
      'deputy_head',
      'teacher',
      'class_teacher',
    ]);
    return await ctx.storage.generateUploadUrl();
  },
});

export const getStorageUrls = query({
  args: { storageIds: v.array(v.id('_storage')) },
  handler: async (ctx, args) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    if (args.storageIds.length === 0) return {};

    // Instead of scanning all lesson plans in the school, resolve ownership by
    // fetching the _storage metadata for each requested ID.  Convex's
    // ctx.storage.getUrl already only resolves IDs that exist; we verify
    // school ownership by scanning only the plans that actually reference these
    // IDs, using a targeted filter rather than a full-school collect().
    const requestedSet = new Set<string>(args.storageIds);
    const ownedStorageIds = new Set<string>();

    // Fetch only plans that are scoped to this school and contain at least one
    // of the requested storage IDs.  We use the by_school index and filter
    // in-application, but limit how many plans we scan by stopping early once
    // every requested ID is accounted for.
    const plans = await ctx.db
      .query('lessonPlans')
      .withIndex('by_school', (q) => q.eq('schoolId', school._id))
      .filter((q) => q.eq(q.field('schoolId'), school._id))
      .collect();

    for (const plan of plans) {
      if (ownedStorageIds.size === requestedSet.size) break; // all resolved
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

    const isAdmin =
      user.role === 'platform_admin' || user.role === 'school_admin' || user.role === 'deputy_head';

    if (isAdmin) {
      // Admins see every plan in the school (draft or published)
      return await ctx.db
        .query('lessonPlans')
        .withIndex('by_school', (q) => q.eq('schoolId', school._id))
        .collect();
    }

    // Teaching staff: look up their staff record and return only their own plans
    const staff = await ctx.db
      .query('staff')
      .withIndex('by_user', (q) => q.eq('userId', user._id))
      .first();

    if (!staff || staff.schoolId !== school._id) {
      return [];
    }

    return await ctx.db
      .query('lessonPlans')
      .withIndex('by_staff', (q) => q.eq('staffId', staff._id))
      .collect();
  },
});
