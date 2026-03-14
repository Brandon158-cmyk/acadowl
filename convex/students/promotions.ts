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
    const { school } = await requirePermission(ctx, Permission.PROMOTE_STUDENTS);

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

    // Preload all exam sessions for the source year's terms
    const allSessions = (
      await Promise.all(
        terms.map((term) =>
          ctx.db
            .query('examSessions')
            .withIndex('by_term', (q) => q.eq('schoolId', school._id).eq('termId', term._id))
            .collect(),
        ),
      )
    ).flat();

    const validSessionIds = new Set(
      allSessions
        .filter((s) => s.type === 'terminal' || s.type === 'final')
        .map((s) => s._id.toString()),
    );

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
        const relevantResults = allResults.filter((result) =>
          validSessionIds.has(result.examSessionId.toString()),
        );

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
        currentAcademicYearId: v.optional(v.id('academicYears')),
        currentGradeId: v.optional(v.id('grades')),
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

    const grades = await ctx.db
      .query('grades')
      .withIndex('by_school', (q) => q.eq('schoolId', school._id))
      .collect();

    const gradesMap = new Map(grades.map((g) => [g._id.toString(), g]));

    const today = new Date().toISOString().split('T')[0];
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

      // Staleness check: if caller supplied current state, verify it matches the DB
      if (item.currentAcademicYearId && student.currentAcademicYearId !== item.currentAcademicYearId) {
        throwEduError(
          EduError.VALIDATION_ERROR,
          `Student data is stale: academic year mismatch for student ${student.firstName} ${student.lastName}.`,
        );
      }
      if (item.currentGradeId && student.currentGradeId !== item.currentGradeId) {
        throwEduError(
          EduError.VALIDATION_ERROR,
          `Student data is stale: grade mismatch for student ${student.firstName} ${student.lastName}.`,
        );
      }

      switch (item.action) {
        case 'promote': {
          if (!item.toSectionId) {
            throwEduError(
              EduError.VALIDATION_ERROR,
              `Target section is required for promoting student ${student.firstName} ${student.lastName}.`,
            );
          }
          const targetSection = await ctx.db.get(item.toSectionId);
          if (!targetSection || targetSection.schoolId !== school._id) {
            throwEduError(EduError.NOT_FOUND, 'Target section not found.');
          }
          if (targetSection.academicYearId !== args.toAcademicYearId) {
            throwEduError(
              EduError.VALIDATION_ERROR,
              `Target section "${targetSection.displayName}" does not belong to the target academic year.`,
            );
          }
          // Validate grade level: promote must go to currentGrade.level + 1
          const currentGrade = gradesMap.get(student.currentGradeId.toString());
          const targetGrade = gradesMap.get(targetSection.gradeId.toString());
          if (currentGrade && targetGrade && targetGrade.level !== currentGrade.level + 1) {
            throwEduError(
              EduError.VALIDATION_ERROR,
              `Cannot promote ${student.firstName} ${student.lastName} from ${currentGrade.name} to ${targetGrade.name}: target grade must be one level higher.`,
            );
          }

          // ISSUE-056: Close current history record
          const promCurrent = await ctx.db
            .query('sectionHistory')
            .withIndex('by_student', (q) => q.eq('studentId', item.studentId))
            .filter((q) => q.eq(q.field('toDate'), undefined))
            .first();
          if (promCurrent) await ctx.db.patch(promCurrent._id, { toDate: today });

          await ctx.db.patch(item.studentId, {
            currentSectionId: item.toSectionId,
            currentGradeId: targetSection.gradeId,
            currentAcademicYearId: args.toAcademicYearId,
            updatedAt: Date.now(),
          });

          // ISSUE-056: Create new history record for promotion
          await ctx.db.insert('sectionHistory', {
            schoolId: school._id,
            studentId: item.studentId,
            sectionId: item.toSectionId,
            gradeId: targetSection.gradeId,
            academicYearId: args.toAcademicYearId,
            fromDate: today,
            reason: 'grade_promotion',
            changedBy: user._id,
            createdAt: Date.now(),
          });
          promoted++;
          break;
        }

        case 'repeat': {
          if (!item.toSectionId) {
            throwEduError(
              EduError.VALIDATION_ERROR,
              `Target section is required for repeating student ${student.firstName} ${student.lastName}.`,
            );
          }
          const targetSection = await ctx.db.get(item.toSectionId);
          if (!targetSection || targetSection.schoolId !== school._id) {
            throwEduError(EduError.NOT_FOUND, 'Target section not found.');
          }
          if (targetSection.academicYearId !== args.toAcademicYearId) {
            throwEduError(
              EduError.VALIDATION_ERROR,
              `Target section "${targetSection.displayName}" does not belong to the target academic year.`,
            );
          }
          // Validate grade level: repeat must stay at same grade level
          const currentGradeRep = gradesMap.get(student.currentGradeId.toString());
          const targetGradeRep = gradesMap.get(targetSection.gradeId.toString());
          if (currentGradeRep && targetGradeRep && targetGradeRep.level !== currentGradeRep.level) {
            throwEduError(
              EduError.VALIDATION_ERROR,
              `Cannot repeat ${student.firstName} ${student.lastName} into ${targetGradeRep.name}: target grade must match current grade ${currentGradeRep.name}.`,
            );
          }

          // ISSUE-056: Close current history record
          const repCurrent = await ctx.db
            .query('sectionHistory')
            .withIndex('by_student', (q) => q.eq('studentId', item.studentId))
            .filter((q) => q.eq(q.field('toDate'), undefined))
            .first();
          if (repCurrent) await ctx.db.patch(repCurrent._id, { toDate: today });

          await ctx.db.patch(item.studentId, {
            currentSectionId: item.toSectionId,
            currentAcademicYearId: args.toAcademicYearId,
            updatedAt: Date.now(),
          });

          // ISSUE-056: Create new history record for repeat
          await ctx.db.insert('sectionHistory', {
            schoolId: school._id,
            studentId: item.studentId,
            sectionId: item.toSectionId,
            gradeId: student.currentGradeId,
            academicYearId: args.toAcademicYearId,
            fromDate: today,
            reason: 'grade_repeat',
            changedBy: user._id,
            createdAt: Date.now(),
          });
          repeated++;
          break;
        }

        case 'graduate': {
          // ISSUE-056: Close current history record
          const gradCurrent = await ctx.db
            .query('sectionHistory')
            .withIndex('by_student', (q) => q.eq('studentId', item.studentId))
            .filter((q) => q.eq(q.field('toDate'), undefined))
            .first();
          if (gradCurrent) await ctx.db.patch(gradCurrent._id, { toDate: today });

          await ctx.db.patch(item.studentId, {
            status: 'graduated',
            graduationDate: today,
            updatedAt: Date.now(),
          });
          graduated++;
          break;
        }

        case 'withdraw': {
          // ISSUE-056: Close current history record
          const withCurrent = await ctx.db
            .query('sectionHistory')
            .withIndex('by_student', (q) => q.eq('studentId', item.studentId))
            .filter((q) => q.eq(q.field('toDate'), undefined))
            .first();
          if (withCurrent) await ctx.db.patch(withCurrent._id, { toDate: today });

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
