import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { requirePermission } from '../_lib/permissions';
import { getAuthenticatedUserAndSchool } from '../_lib/schoolContext';
import { Permission } from '../../src/lib/roles/types';
import { EduError, throwEduError } from '../_lib/errors';

// ── ISSUE-054 · Year-End Student Promotion Engine ───────────────────────────

/**
 * Prepare a promotion preview — returns all active students grouped by grade/section
 * for a given academic year, with their terminal exam results to inform promotion decisions.
 */
export const preparePromotion = query({
  args: {
    fromAcademicYearId: v.id('academicYears'),
    toAcademicYearId: v.id('academicYears'),
  },
  handler: async (ctx, args) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    // Validate both academic years belong to this school
    const fromYear = await ctx.db.get(args.fromAcademicYearId);
    if (!fromYear || fromYear.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Source academic year not found.');
    }

    const toYear = await ctx.db.get(args.toAcademicYearId);
    if (!toYear || toYear.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Target academic year not found.');
    }

    // Get all active students in the source academic year
    const students = await ctx.db
      .query('students')
      .withIndex('by_school_year', (q) =>
        q.eq('schoolId', school._id).eq('currentAcademicYearId', args.fromAcademicYearId),
      )
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect();

    // Get all grades for this school
    const grades = await ctx.db
      .query('grades')
      .withIndex('by_school', (q) => q.eq('schoolId', school._id))
      .collect();

    const gradesMap = new Map(grades.map((g) => [g._id, g]));

    // Get all sections in the target year (for placement options)
    const targetSections = await ctx.db
      .query('sections')
      .withIndex('by_academic_year', (q) =>
        q.eq('schoolId', school._id).eq('academicYearId', args.toAcademicYearId),
      )
      .filter((q) => q.eq(q.field('isActive'), true))
      .collect();

    // Get terminal exam sessions for the from-year terms
    const terms = await ctx.db
      .query('terms')
      .withIndex('by_academic_year', (q) =>
        q.eq('schoolId', school._id).eq('academicYearId', args.fromAcademicYearId),
      )
      .collect();

    const termIds = terms.map((t) => t._id);

    // Build student promotion data
    const promotionData = await Promise.all(
      students.map(async (student) => {
        const grade = gradesMap.get(student.currentGradeId);
        const section = await ctx.db.get(student.currentSectionId);

        // Get exam results for this student across all terms of the from-year
        const allResults = await ctx.db
          .query('examResults')
          .withIndex('by_student', (q) => q.eq('studentId', student._id))
          .collect();

        // Filter to terminal/final exams in the source year's terms
        const relevantResults = [];
        for (const result of allResults) {
          const session = await ctx.db.get(result.examSessionId);
          if (
            session &&
            termIds.includes(session.termId) &&
            (session.type === 'terminal' || session.type === 'final')
          ) {
            relevantResults.push(result);
          }
        }

        // Calculate average score
        const scores = relevantResults
          .filter((r) => r.score !== undefined && r.score !== null)
          .map((r) => r.score!);
        const averageScore =
          scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null;

        // Suggest action based on grade
        let suggestedAction: 'promote' | 'repeat' | 'graduate' = 'promote';
        if (grade?.graduationGrade) {
          suggestedAction = 'graduate';
        } else if (averageScore !== null && averageScore < 40) {
          suggestedAction = 'repeat';
        }

        // Find next grade for promotion suggestions
        const nextGrade = grade
          ? grades.find((g) => g.level === grade.level + 1)
          : null;

        // Find available sections in next grade (target year)
        const nextGradeSections = nextGrade
          ? targetSections.filter((s) => s.gradeId === nextGrade._id)
          : [];

        // Find same-grade sections in target year (for repeaters)
        const sameGradeSections = grade
          ? targetSections.filter((s) => s.gradeId === grade._id)
          : [];

        return {
          studentId: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          studentNumber: student.studentNumber,
          photoUrl: student.photoUrl,
          currentGradeId: student.currentGradeId,
          currentGradeName: grade?.name ?? '',
          currentGradeLevel: grade?.level ?? 0,
          currentSectionName: section?.displayName ?? '',
          averageScore,
          suggestedAction,
          nextGradeId: nextGrade?._id,
          nextGradeName: nextGrade?.name,
          nextGradeSections: nextGradeSections.map((s) => ({
            _id: s._id,
            displayName: s.displayName,
          })),
          sameGradeSections: sameGradeSections.map((s) => ({
            _id: s._id,
            displayName: s.displayName,
          })),
          isGraduationGrade: grade?.graduationGrade ?? false,
        };
      }),
    );

    // Group by grade
    const byGrade = new Map<string, typeof promotionData>();
    for (const item of promotionData) {
      const key = item.currentGradeId;
      if (!byGrade.has(key)) byGrade.set(key, []);
      byGrade.get(key)!.push(item);
    }

    // Convert to sorted array
    const grouped = Array.from(byGrade.entries())
      .map(([gradeId, students]) => ({
        gradeId,
        gradeName: students[0].currentGradeName,
        gradeLevel: students[0].currentGradeLevel,
        students: students.sort((a, b) =>
          `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`),
        ),
      }))
      .sort((a, b) => a.gradeLevel - b.gradeLevel);

    return {
      fromYear: { _id: fromYear._id, year: fromYear.year, label: fromYear.label },
      toYear: { _id: toYear._id, year: toYear.year, label: toYear.label },
      grades: grouped,
      totalStudents: promotionData.length,
      targetSectionsAvailable: targetSections.length > 0,
    };
  },
});

/**
 * Bulk promote students — atomic operation.
 * Each student gets an action: promote, repeat, graduate, or withdraw.
 */
export const bulkPromoteStudents = mutation({
  args: {
    toAcademicYearId: v.id('academicYears'),
    actions: v.array(
      v.object({
        studentId: v.id('students'),
        action: v.union(
          v.literal('promote'),
          v.literal('repeat'),
          v.literal('graduate'),
          v.literal('withdraw'),
        ),
        toSectionId: v.optional(v.id('sections')),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const { user, school } = await requirePermission(ctx, Permission.PROMOTE_STUDENTS);

    // Validate target academic year
    const toYear = await ctx.db.get(args.toAcademicYearId);
    if (!toYear || toYear.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Target academic year not found.');
    }

    // Validate target year has sections
    const targetSections = await ctx.db
      .query('sections')
      .withIndex('by_academic_year', (q) =>
        q.eq('schoolId', school._id).eq('academicYearId', args.toAcademicYearId),
      )
      .collect();

    if (targetSections.length === 0) {
      throwEduError(
        EduError.VALIDATION_ERROR,
        'Target academic year has no sections created. Create sections before promoting.',
      );
    }

    const grades = await ctx.db
      .query('grades')
      .withIndex('by_school', (q) => q.eq('schoolId', school._id))
      .collect();

    let promoted = 0;
    let repeated = 0;
    let graduated = 0;
    let withdrawn = 0;
    let skipped = 0;

    for (const item of args.actions) {
      const student = await ctx.db.get(item.studentId);
      if (!student || student.schoolId !== school._id || student.status !== 'active') {
        skipped++;
        continue;
      }

      switch (item.action) {
        case 'promote': {
          if (!item.toSectionId) {
            skipped++;
            continue;
          }
          const targetSection = await ctx.db.get(item.toSectionId);
          if (!targetSection || targetSection.schoolId !== school._id) {
            skipped++;
            continue;
          }
          await ctx.db.patch(item.studentId, {
            currentSectionId: item.toSectionId,
            currentGradeId: targetSection.gradeId,
            currentAcademicYearId: args.toAcademicYearId,
            updatedAt: Date.now(),
          });
          promoted++;
          break;
        }

        case 'repeat': {
          if (!item.toSectionId) {
            skipped++;
            continue;
          }
          const targetSection = await ctx.db.get(item.toSectionId);
          if (!targetSection || targetSection.schoolId !== school._id) {
            skipped++;
            continue;
          }
          await ctx.db.patch(item.studentId, {
            currentSectionId: item.toSectionId,
            currentAcademicYearId: args.toAcademicYearId,
            updatedAt: Date.now(),
          });
          repeated++;
          break;
        }

        case 'graduate': {
          await ctx.db.patch(item.studentId, {
            status: 'graduated',
            graduationDate: new Date().toISOString().split('T')[0],
            updatedAt: Date.now(),
          });
          graduated++;
          break;
        }

        case 'withdraw': {
          await ctx.db.patch(item.studentId, {
            status: 'withdrawn',
            updatedAt: Date.now(),
          });
          withdrawn++;
          break;
        }
      }
    }

    return {
      promoted,
      repeated,
      graduated,
      withdrawn,
      skipped,
      total: args.actions.length,
    };
  },
});
