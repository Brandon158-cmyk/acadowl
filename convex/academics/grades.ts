import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { getAuthenticatedUserAndSchool } from '../_lib/schoolContext';
import { requirePermission } from '../_lib/permissions';
import { Permission } from '../../src/lib/roles/types';
import { EduError, throwEduError } from '../_lib/errors';
import { Doc } from '../_generated/dataModel';

export const createGrade = mutation({
  args: {
    name: v.string(),
    level: v.number(),
    stream: v.optional(v.string()),
    graduationGrade: v.boolean(),
    order: v.number(),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.MANAGE_SCHOOL_SETTINGS);

    return await ctx.db.insert('grades', {
      schoolId: school._id,
      name: args.name,
      level: args.level,
      stream: args.stream,
      graduationGrade: args.graduationGrade,
      order: args.order,
    });
  },
});

export const updateGrade = mutation({
  args: {
    id: v.id('grades'),
    name: v.optional(v.string()),
    level: v.optional(v.number()),
    stream: v.optional(v.string()),
    graduationGrade: v.optional(v.boolean()),
    order: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.MANAGE_SCHOOL_SETTINGS);

    const grade = await ctx.db.get(args.id);
    if (!grade || grade.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Grade not found');
    }

    const updates: Partial<Doc<'grades'>> = {};
    if (args.name !== undefined) updates.name = args.name;
    if (args.level !== undefined) updates.level = args.level;
    if (args.stream !== undefined) updates.stream = args.stream;
    if (args.graduationGrade !== undefined) updates.graduationGrade = args.graduationGrade;
    if (args.order !== undefined) updates.order = args.order;

    await ctx.db.patch(args.id, updates);
  },
});

export const getGradesBySchool = query({
  args: {},
  handler: async (ctx) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);
    if (!school) return [];

    const grades = await ctx.db
      .query('grades')
      .withIndex('by_school', (q) => q.eq('schoolId', school._id))
      .collect();

    return grades.sort((a, b) => a.order - b.order);
  },
});

export const seedDefaultGrades = mutation({
  args: {},
  handler: async (ctx) => {
    const { school } = await requirePermission(ctx, Permission.MANAGE_SCHOOL_SETTINGS);

    const existingGrades = await ctx.db
      .query('grades')
      .withIndex('by_school', (q) => q.eq('schoolId', school._id))
      .collect();

    if (existingGrades.length > 0) return;

    let gradesToCreate: Array<Omit<Doc<'grades'>, '_id' | '_creationTime'>> = [];

    const primaryGrades = [
      { name: 'Grade 1', level: 1, order: 1, graduationGrade: false },
      { name: 'Grade 2', level: 2, order: 2, graduationGrade: false },
      { name: 'Grade 3', level: 3, order: 3, graduationGrade: false },
      { name: 'Grade 4', level: 4, order: 4, graduationGrade: false },
      { name: 'Grade 5', level: 5, order: 5, graduationGrade: false },
      { name: 'Grade 6', level: 6, order: 6, graduationGrade: false },
      { name: 'Grade 7', level: 7, order: 7, graduationGrade: true }, // End of Primary
    ];

    const juniorSecGrades = [
      { name: 'Grade 8', level: 8, order: 8, graduationGrade: false },
      { name: 'Grade 9', level: 9, order: 9, graduationGrade: true }, // Junior Sec end
    ];

    const seniorSecGrades = [
      { name: 'Grade 10', level: 10, order: 10, graduationGrade: false },
      { name: 'Grade 11', level: 11, order: 11, graduationGrade: false },
      { name: 'Grade 12', level: 12, order: 12, graduationGrade: true }, // Senior Sec end
    ];

    if (['day_primary', 'boarding_primary'].includes(school.type)) {
      gradesToCreate = primaryGrades.map((g) => ({ ...g, schoolId: school._id }));
    } else if (['day_secondary', 'boarding_secondary'].includes(school.type)) {
      gradesToCreate = [...juniorSecGrades, ...seniorSecGrades].map((g) => ({
        ...g,
        schoolId: school._id,
      }));
    } else if (school.type === 'mixed_secondary') {
      // Typically 8-12 but can have primary attached
      gradesToCreate = [...primaryGrades, ...juniorSecGrades, ...seniorSecGrades].map((g) => ({
        ...g,
        schoolId: school._id,
      }));
    } else if (school.type === 'college' || school.type === 'technical') {
      gradesToCreate = [
        { name: 'Year 1', level: 1, order: 1, graduationGrade: false, schoolId: school._id },
        { name: 'Year 2', level: 2, order: 2, graduationGrade: false, schoolId: school._id },
        { name: 'Year 3', level: 3, order: 3, graduationGrade: true, schoolId: school._id },
      ];
    }

    for (const grade of gradesToCreate) {
      await ctx.db.insert('grades', grade);
    }
  },
});
