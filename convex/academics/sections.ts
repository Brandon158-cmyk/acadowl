import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { getAuthenticatedUserAndSchool } from '../_lib/schoolContext';
import { requirePermission } from '../_lib/permissions';
import { Permission } from '../../src/lib/roles/types';
import { EduError, throwEduError } from '../_lib/errors';
import { Doc } from '../_generated/dataModel';

// ── ISSUE-055 · Section Management — Create, Edit, Assign Class Teacher ──

/**
 * Create a class section within a grade for an academic year.
 * Name must be unique within grade × academic year.
 */
export const createSection = mutation({
  args: {
    gradeId: v.id('grades'),
    academicYearId: v.id('academicYears'),
    name: v.string(), // e.g. "A", "B", "Sciences"
    displayName: v.optional(v.string()), // e.g. "Grade 8A" — auto-generated if omitted
    capacity: v.optional(v.number()),
    room: v.optional(v.string()),
    classTeacherId: v.optional(v.id('staff')),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.MANAGE_SCHOOL_SETTINGS);

    // Validate grade belongs to this school
    const grade = await ctx.db.get(args.gradeId);
    if (!grade || grade.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Grade not found or does not belong to your school.');
    }

    // Validate academic year belongs to this school
    const academicYear = await ctx.db.get(args.academicYearId);
    if (!academicYear || academicYear.schoolId !== school._id) {
      throwEduError(
        EduError.NOT_FOUND,
        'Academic year not found or does not belong to your school.',
      );
    }

    // Validate class teacher belongs to this school (if provided)
    if (args.classTeacherId) {
      const teacher = await ctx.db.get(args.classTeacherId);
      if (!teacher || teacher.schoolId !== school._id) {
        throwEduError(
          EduError.NOT_FOUND,
          'Staff member not found or does not belong to your school.',
        );
      }

      // If this teacher is already the class teacher of another section, clear that assignment
      if (teacher.classSectionId) {
        const oldSection = await ctx.db.get(teacher.classSectionId);
        if (oldSection && oldSection.classTeacherId === args.classTeacherId) {
          await ctx.db.patch(teacher.classSectionId, { classTeacherId: undefined });
        }
        await ctx.db.patch(args.classTeacherId, { classSectionId: undefined });
      }
    }

    // Enforce unique name within grade × academic year
    const existing = await ctx.db
      .query('sections')
      .withIndex('by_grade', (q) => q.eq('schoolId', school._id).eq('gradeId', args.gradeId))
      .filter((q) =>
        q.and(
          q.eq(q.field('academicYearId'), args.academicYearId),
          q.eq(q.field('name'), args.name.trim()),
        ),
      )
      .first();

    if (existing) {
      throwEduError(
        EduError.ALREADY_EXISTS,
        `Section "${args.name}" already exists in this grade and academic year.`,
      );
    }

    // Determine the display order (one more than the highest existing order in this grade)
    const siblings = await ctx.db
      .query('sections')
      .withIndex('by_grade', (q) => q.eq('schoolId', school._id).eq('gradeId', args.gradeId))
      .filter((q) => q.eq(q.field('academicYearId'), args.academicYearId))
      .collect();

    const nextOrder = siblings.length > 0 ? Math.max(...siblings.map((s) => s.order)) + 1 : 1;

    // Auto-generate displayName if not provided
    const displayName = args.displayName?.trim() || `${grade!.name} ${args.name.trim()}`;

    const sectionId = await ctx.db.insert('sections', {
      schoolId: school._id,
      gradeId: args.gradeId,
      academicYearId: args.academicYearId,
      name: args.name.trim(),
      displayName,
      capacity: args.capacity,
      room: args.room,
      classTeacherId: args.classTeacherId,
      order: nextOrder,
      isActive: true,
      createdAt: Date.now(),
    });

    // If a class teacher was provided, update their classSectionId
    if (args.classTeacherId) {
      await ctx.db.patch(args.classTeacherId, { classSectionId: sectionId });
    }

    return sectionId;
  },
});

/**
 * Update a section's details (name, room, capacity).
 */
export const updateSection = mutation({
  args: {
    id: v.id('sections'),
    name: v.optional(v.string()),
    displayName: v.optional(v.string()),
    capacity: v.optional(v.number()),
    room: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.MANAGE_SCHOOL_SETTINGS);

    const section = await ctx.db.get(args.id);
    if (!section || section.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Section not found.');
    }

    // If renaming, check uniqueness within grade × academic year
    if (args.name && args.name.trim() !== section!.name) {
      const conflict = await ctx.db
        .query('sections')
        .withIndex('by_grade', (q) => q.eq('schoolId', school._id).eq('gradeId', section!.gradeId))
        .filter((q) =>
          q.and(
            q.eq(q.field('academicYearId'), section!.academicYearId),
            q.eq(q.field('name'), args.name!.trim()),
          ),
        )
        .first();

      if (conflict && conflict._id !== args.id) {
        throwEduError(
          EduError.ALREADY_EXISTS,
          `Section name "${args.name}" is already taken in this grade and year.`,
        );
      }
    }

    const updates: Partial<Doc<'sections'>> = {};
    if (args.name !== undefined) {
      updates.name = args.name.trim();
      // Auto-update displayName if it was previously auto-generated
      if (!args.displayName) {
        const grade = await ctx.db.get(section!.gradeId);
        if (grade) updates.displayName = `${grade.name} ${args.name.trim()}`;
      }
    }
    if (args.displayName !== undefined) updates.displayName = args.displayName.trim();
    if (args.capacity !== undefined) updates.capacity = args.capacity;
    if (args.room !== undefined) updates.room = args.room;

    await ctx.db.patch(args.id, updates);
  },
});

/**
 * Assign (or reassign) a class teacher to a section.
 * - Clears the old teacher's classSectionId if they had a previous assignment.
 * - Sets the new teacher's classSectionId.
 * - Updates section.classTeacherId.
 */
export const assignClassTeacher = mutation({
  args: {
    sectionId: v.id('sections'),
    staffId: v.optional(v.id('staff')), // Pass undefined to unassign
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.MANAGE_SCHOOL_SETTINGS);

    const section = await ctx.db.get(args.sectionId);
    if (!section || section.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Section not found.');
    }

    // If assigning a new teacher, validate they belong to this school
    if (args.staffId) {
      const staff = await ctx.db.get(args.staffId);
      if (!staff || staff.schoolId !== school._id) {
        throwEduError(EduError.NOT_FOUND, 'Staff member not found.');
      }

      // If the new teacher already has a different class section assigned, clear it
      if (staff.classSectionId && staff.classSectionId !== args.sectionId) {
        await ctx.db.patch(staff.classSectionId, { classTeacherId: undefined });
      }

      // Set the new teacher's classSectionId
      await ctx.db.patch(args.staffId, { classSectionId: args.sectionId });
    }

    // If there was a previous teacher and we're reassigning (or unassigning), clear their classSectionId
    if (section!.classTeacherId && section!.classTeacherId !== args.staffId) {
      const oldTeacher = await ctx.db.get(section!.classTeacherId);
      if (oldTeacher && oldTeacher.classSectionId === args.sectionId) {
        await ctx.db.patch(section!.classTeacherId, { classSectionId: undefined });
      }
    }

    // Update the section's classTeacherId
    await ctx.db.patch(args.sectionId, { classTeacherId: args.staffId });
  },
});

/**
 * Get all sections for a grade in a given academic year.
 */
export const getSectionsByGrade = query({
  args: {
    gradeId: v.id('grades'),
    academicYearId: v.id('academicYears'),
  },
  handler: async (ctx, args) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    const sections = await ctx.db
      .query('sections')
      .withIndex('by_grade', (q) => q.eq('schoolId', school._id).eq('gradeId', args.gradeId))
      .filter((q) => q.eq(q.field('academicYearId'), args.academicYearId))
      .collect();

    // Resolve class teacher names for display
    const enriched = await Promise.all(
      sections.map(async (section) => {
        let classTeacher: { firstName: string; lastName: string } | null = null;
        if (section.classTeacherId) {
          const staff = await ctx.db.get(section.classTeacherId);
          if (staff) {
            classTeacher = { firstName: staff.firstName, lastName: staff.lastName };
          }
        }
        return { ...section, classTeacher };
      }),
    );

    return enriched.sort((a, b) => a.order - b.order);
  },
});

/**
 * Get all sections for the current academic year, grouped-friendly.
 * Used by student enrolment forms (grade → section dropdown).
 */
export const getSectionsByYear = query({
  args: {
    academicYearId: v.id('academicYears'),
  },
  handler: async (ctx, args) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    const sections = await ctx.db
      .query('sections')
      .withIndex('by_academic_year', (q) =>
        q.eq('schoolId', school._id).eq('academicYearId', args.academicYearId),
      )
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();

    return sections.sort((a, b) => a.order - b.order);
  },
});

/**
 * Get a section with its enrolled student count.
 * Full student list comes from the students module — this returns metadata only.
 */
export const getSectionWithStudents = query({
  args: {
    sectionId: v.id('sections'),
  },
  handler: async (ctx, args) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    const section = await ctx.db.get(args.sectionId);
    if (!section || section.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Section not found.');
    }

    // Count enrolled active students
    const students = await ctx.db
      .query('students')
      .withIndex('by_section', (q) => q.eq('currentSectionId', args.sectionId))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect();

    // Resolve class teacher
    let classTeacher: {
      _id: string;
      firstName: string;
      lastName: string;
      photoUrl?: string;
    } | null = null;
    if (section!.classTeacherId) {
      const staff = await ctx.db.get(section!.classTeacherId);
      if (staff) {
        classTeacher = {
          _id: staff._id,
          firstName: staff.firstName,
          lastName: staff.lastName,
          photoUrl: staff.photoUrl,
        };
      }
    }

    return {
      ...section,
      enrolledCount: students.length,
      students,
      classTeacher,
    };
  },
});

/**
 * Get capacity status for a section — used by the enrolment form to show available spots.
 */
export const getSectionCapacityStatus = query({
  args: {
    sectionId: v.id('sections'),
  },
  handler: async (ctx, args) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    const section = await ctx.db.get(args.sectionId);
    if (!section || section.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Section not found.');
    }

    const enrolled = await ctx.db
      .query('students')
      .withIndex('by_section', (q) => q.eq('currentSectionId', args.sectionId))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect();

    const enrolledCount = enrolled.length;
    const capacity = section!.capacity ?? null;
    const available = capacity !== null ? Math.max(0, capacity - enrolledCount) : null;

    return {
      sectionId: args.sectionId,
      capacity,
      enrolled: enrolledCount,
      available,
      isFull: capacity !== null ? enrolledCount >= capacity : false,
      fillPercent: capacity ? Math.round((enrolledCount / capacity) * 100) : null,
    };
  },
});
