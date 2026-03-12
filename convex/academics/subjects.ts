import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { getAuthenticatedUserAndSchool } from '../_lib/schoolContext';
import { requirePermission } from '../_lib/permissions';
import { Permission } from '../../src/lib/roles/types';
import { EduError, throwEduError } from '../_lib/errors';
import { Doc } from '../_generated/dataModel';

export const createSubject = mutation({
  args: {
    name: v.string(),
    code: v.optional(v.string()),
    gradeIds: v.array(v.id('grades')),
    isCompulsory: v.boolean(),
    eczSubjectCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.MANAGE_SCHOOL_SETTINGS);

    if (args.code) {
      const existing = await ctx.db
        .query('subjects')
        .withIndex('by_school', (q) => q.eq('schoolId', school._id))
        .filter((q) => q.eq(q.field('code'), args.code))
        .first();

      if (existing) {
        throwEduError(EduError.ALREADY_EXISTS, `Subject code ${args.code} already exists.`);
      }
    }

    // Enforce unique name within the school
    const nameConflict = await ctx.db
      .query('subjects')
      .withIndex('by_school', (q) => q.eq('schoolId', school._id))
      .filter((q) => q.eq(q.field('name'), args.name))
      .first();
    if (nameConflict) {
      throwEduError(EduError.ALREADY_EXISTS, `Subject name "${args.name}" already exists.`);
    }

    // Validate all gradeIds belong to this school
    for (const gradeId of args.gradeIds) {
      const grade = await ctx.db.get(gradeId);
      if (!grade || grade.schoolId !== school._id) {
        throwEduError(EduError.FORBIDDEN, `Grade ${gradeId} does not belong to your school.`);
      }
    }

    const subjectId = await ctx.db.insert('subjects', {
      schoolId: school._id,
      name: args.name,
      code: args.code,
      gradeIds: args.gradeIds,
      isCompulsory: args.isCompulsory,
      eczSubjectCode: args.eczSubjectCode,
    });

    return subjectId;
  },
});

export const updateSubject = mutation({
  args: {
    id: v.id('subjects'),
    name: v.optional(v.string()),
    code: v.optional(v.string()),
    gradeIds: v.optional(v.array(v.id('grades'))),
    isCompulsory: v.optional(v.boolean()),
    eczSubjectCode: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.MANAGE_SCHOOL_SETTINGS);

    const subject = await ctx.db.get(args.id);
    if (!subject || subject.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Subject not found');
    }

    if (args.code && args.code !== subject.code) {
      const existing = await ctx.db
        .query('subjects')
        .withIndex('by_school', (q) => q.eq('schoolId', school._id))
        .filter((q) => q.eq(q.field('code'), args.code))
        .first();

      if (existing) {
        throwEduError(EduError.ALREADY_EXISTS, `Subject code ${args.code} already exists.`);
      }
    }

    // Enforce unique name within the school (same invariant as createSubject)
    if (args.name !== undefined && args.name !== subject.name) {
      const nameConflict = await ctx.db
        .query('subjects')
        .withIndex('by_school', (q) => q.eq('schoolId', school._id))
        .filter((q) => q.eq(q.field('name'), args.name))
        .first();
      if (nameConflict && nameConflict._id !== args.id) {
        throwEduError(EduError.ALREADY_EXISTS, `Subject name "${args.name}" already exists.`);
      }
    }

    const updates: Partial<Doc<'subjects'>> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.code !== undefined) updates.code = args.code;
    if (args.gradeIds !== undefined) {
      // Validate all gradeIds belong to this school
      for (const gradeId of args.gradeIds) {
        const grade = await ctx.db.get(gradeId);
        if (!grade || grade.schoolId !== school._id) {
          throwEduError(EduError.FORBIDDEN, `Grade ${gradeId} does not belong to your school.`);
        }
      }
      updates.gradeIds = args.gradeIds;
    }
    if (args.isCompulsory !== undefined) updates.isCompulsory = args.isCompulsory;
    if (args.eczSubjectCode !== undefined) updates.eczSubjectCode = args.eczSubjectCode;

    await ctx.db.patch(args.id, updates);
  },
});

export const deactivateSubject = mutation({
  args: {
    id: v.id('subjects'),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.MANAGE_SCHOOL_SETTINGS);

    const subject = await ctx.db.get(args.id);
    if (!subject || subject.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Subject not found');
    }

    // Since our schema only has `gradeIds` as the array indicating placement,
    // to "deactivate" it we could clear the grade assignments so it can't be added to new timetables.
    // The requirement mentions 'soft-delete — hides from new timetable/exams but preserves historical data'
    // To properly support soft-delete with minimal schema change, we could just clear gradeIds.
    // If we wanted an isActive flag, we would add it to the schema, but wait, schema doesn't have isActive for subjects.
    // For now, setting gradeIds to empty array achieves hiding it from future use.
    await ctx.db.patch(args.id, { gradeIds: [] });
  },
});

export const getSubjectsByGrade = query({
  args: {
    gradeId: v.id('grades'),
  },
  handler: async (ctx, args) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    const allSubjects = await ctx.db
      .query('subjects')
      .withIndex('by_school', (q) => q.eq('schoolId', school._id))
      .collect();

    return allSubjects.filter((s) => s.gradeIds.includes(args.gradeId));
  },
});

export const getSubjectsBySchool = query({
  args: {},
  handler: async (ctx) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    return await ctx.db
      .query('subjects')
      .withIndex('by_school', (q) => q.eq('schoolId', school._id))
      .collect();
  },
});

export const seedDefaultSubjects = mutation({
  args: {},
  returns: v.object({
    created: v.number(),
    skipped: v.number(),
    message: v.optional(v.string()),
  }),
  handler: async (ctx) => {
    const { school } = await requirePermission(ctx, Permission.MANAGE_SCHOOL_SETTINGS);

    const grades = await ctx.db
      .query('grades')
      .withIndex('by_school', (q) => q.eq('schoolId', school._id))
      .collect();

    // Guard: can't seed subjects with no grades — every subject needs at least one level.
    if (grades.length === 0) {
      console.warn(
        '[seedDefaultSubjects] No grades found for school',
        school._id,
        '— aborting seed.',
      );
      return {
        created: 0,
        skipped: 0,
        message: 'No grades configured. Please add grades before seeding subjects.',
      };
    }

    // Group grades by level for assignment
    const primaryGradeIds = grades.filter((g) => g.level >= 1 && g.level <= 7).map((g) => g._id);
    const juniorSecGradeIds = grades.filter((g) => g.level >= 8 && g.level <= 9).map((g) => g._id);
    const seniorSecGradeIds = grades
      .filter((g) => g.level >= 10 && g.level <= 12)
      .map((g) => g._id);

    // List of MoE defaults
    const primarySubjects = [
      { name: 'English', isCompulsory: true },
      { name: 'Mathematics', isCompulsory: true },
      { name: 'Science', isCompulsory: true },
      { name: 'Social Studies', isCompulsory: true },
      { name: 'Creative Arts', isCompulsory: true },
      { name: 'Physical Education', isCompulsory: true },
      { name: 'Religious Education', isCompulsory: true },
      { name: 'Zambian Languages', isCompulsory: true },
    ];

    const secondarySubjects = [
      { name: 'English Language', code: 'ENG', isCompulsory: true },
      { name: 'Mathematics', code: 'MATH', isCompulsory: true },
      { name: 'Integrated Science', code: 'SCI', isCompulsory: false },
      { name: 'Biology', code: 'BIO', isCompulsory: false },
      { name: 'Chemistry', code: 'CHEM', isCompulsory: false },
      { name: 'Physics', code: 'PHY', isCompulsory: false },
      { name: 'History', code: 'HIST', isCompulsory: false },
      { name: 'Geography', code: 'GEO', isCompulsory: false },
      { name: 'Civic Education', code: 'CIVIC', isCompulsory: true },
      { name: 'Religious Education', code: 'RE', isCompulsory: false },
      { name: 'Home Economics', code: 'HE', isCompulsory: false },
      { name: 'Commerce', code: 'COM', isCompulsory: false },
      { name: 'Principles of Accounts', code: 'ACC', isCompulsory: false },
      { name: 'Computer Studies', code: 'CS', isCompulsory: false },
      { name: 'Physical Education', code: 'PE', isCompulsory: false },
      { name: 'French', code: 'FRE', isCompulsory: false },
      { name: 'Fine Art', code: 'ART', isCompulsory: false },
      { name: 'Music', code: 'MUS', isCompulsory: false },
      { name: 'Design & Technology', code: 'DT', isCompulsory: false },
    ];

    const isPrimary = ['day_primary', 'boarding_primary'].includes(school.type);
    const isSecondary = ['day_secondary', 'boarding_secondary', 'mixed_secondary'].includes(
      school.type,
    );
    const isTechnical = school.type === 'technical';

    const subjectsToCreate: Array<Omit<Doc<'subjects'>, '_id' | '_creationTime'>> = [];

    if (isPrimary || isSecondary) {
      if (isPrimary && primaryGradeIds.length > 0) {
        primarySubjects.forEach((sub) => {
          subjectsToCreate.push({
            schoolId: school._id,
            name: sub.name,
            code: sub.name.substring(0, 3).toUpperCase(),
            gradeIds: primaryGradeIds,
            isCompulsory: sub.isCompulsory,
          });
        });
      }

      if (isSecondary && (juniorSecGradeIds.length > 0 || seniorSecGradeIds.length > 0)) {
        secondarySubjects.forEach((sub) => {
          subjectsToCreate.push({
            schoolId: school._id,
            name: sub.name,
            code: sub.code,
            gradeIds: [...juniorSecGradeIds, ...seniorSecGradeIds],
            isCompulsory: sub.isCompulsory,
          });
        });
      }
    } else if (isTechnical) {
      const technicalSubjects = [
        { name: 'Applied Mathematics', code: 'AMATH', isCompulsory: true },
        { name: 'Technical Drawing', code: 'TD', isCompulsory: true },
        { name: 'Carpentry', code: 'CARP', isCompulsory: false },
        { name: 'Electrical Installation', code: 'ELEC', isCompulsory: false },
        { name: 'Plumbing', code: 'PLUMB', isCompulsory: false },
      ];
      technicalSubjects.forEach((sub) => {
        subjectsToCreate.push({
          schoolId: school._id,
          name: sub.name,
          code: sub.code,
          gradeIds: grades.map((g) => g._id),
          isCompulsory: sub.isCompulsory,
        });
      });
    } else {
      // Unknown school type — skip seeding and surface a clear message so admins know.
      console.warn(
        `seedDefaultSubjects: unknown school.type "${school.type}" for school ${school._id}. No subjects were created.`,
      );
      return { created: 0, skipped: 0, message: `Unknown school type: ${school.type}` };
    }

    // Insert only if neither name nor code already exists for this school (mirrors createSubject's uniqueness rules)
    let created = 0;
    let skipped = 0;
    for (const sub of subjectsToCreate) {
      const existing = await ctx.db
        .query('subjects')
        .withIndex('by_school', (q) => q.eq('schoolId', school._id))
        .filter((q) =>
          q.or(
            q.eq(q.field('name'), sub.name),
            // Only compare codes when the candidate subject has a code
            ...(sub.code ? [q.eq(q.field('code'), sub.code)] : []),
          ),
        )
        .first();

      if (!existing) {
        await ctx.db.insert('subjects', sub);
        created++;
      } else {
        skipped++;
      }
    }
    return { created, skipped };
  },
});
