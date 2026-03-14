import { v } from 'convex/values';
import { query } from '../_generated/server';
import { getAuthenticatedUserAndSchool } from '../_lib/schoolContext';
import { EduError, throwEduError } from '../_lib/errors';

// ── ISSUE-049 · Student Profile View ────────────────────────────────────────
// ── ISSUE-050 · Student List — Search, Filter, and Bulk Operations ──────────

/**
 * Get a single student by ID with resolved section, grade, and guardian info.
 * Used by the student profile page.
 */
export const getStudentById = query({
  args: {
    studentId: v.id('students'),
  },
  handler: async (ctx, args) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    const student = await ctx.db.get(args.studentId);
    if (!student || student.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Student not found.');
    }

    // Resolve section
    const section = student!.currentSectionId
      ? await ctx.db.get(student!.currentSectionId)
      : null;

    // Resolve grade
    const grade = student!.currentGradeId
      ? await ctx.db.get(student!.currentGradeId)
      : null;

    // Resolve academic year
    const academicYear = student!.currentAcademicYearId
      ? await ctx.db.get(student!.currentAcademicYearId)
      : null;

    // Resolve guardian details
    const guardians = await Promise.all(
      (student!.guardianLinks || []).map(async (link) => {
        const guardian = await ctx.db.get(link.guardianId);
        return {
          ...link,
          guardian: guardian
            ? {
                _id: guardian._id,
                firstName: guardian.firstName,
                lastName: guardian.lastName,
                phone: guardian.phone,
                altPhone: guardian.altPhone,
                email: guardian.email,
              }
            : null,
        };
      }),
    );

    // Attendance summary for current term
    let attendanceSummary = {
      totalDays: 0,
      presentDays: 0,
      absentDays: 0,
      lateDays: 0,
      excusedDays: 0,
      attendancePercent: 0,
    };

    if (school.currentTermId) {
      const currentTerm = await ctx.db.get(school.currentTermId);
      if (currentTerm) {
        const attendanceRecords = await ctx.db
          .query('attendance')
          .withIndex('by_student_date', (q) => q.eq('studentId', args.studentId))
          .filter((q) =>
            q.and(
              q.gte(q.field('date'), currentTerm.startDate),
              q.lte(q.field('date'), currentTerm.endDate),
            ),
          )
          .collect();

        const totalDays = attendanceRecords.length;
        const presentDays = attendanceRecords.filter((r) => r.status === 'present').length;
        const absentDays = attendanceRecords.filter((r) => r.status === 'absent').length;
        const lateDays = attendanceRecords.filter((r) => r.status === 'late').length;
        const excusedDays = attendanceRecords.filter(
          (r) => r.status === 'excused' || r.status === 'medical',
        ).length;

        attendanceSummary = {
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          excusedDays,
          attendancePercent: totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0,
        };
      }
    }

    // Recent exam results (last 10)
    const recentResults = await ctx.db
      .query('examResults')
      .withIndex('by_student', (q) => q.eq('studentId', args.studentId))
      .order('desc')
      .take(10);

    // Resolve subject names for exam results
    const resultsWithSubjects = await Promise.all(
      recentResults.map(async (result) => {
        const subject = await ctx.db.get(result.subjectId);
        const session = await ctx.db.get(result.examSessionId);
        return {
          ...result,
          subjectName: subject?.name ?? 'Unknown',
          subjectCode: subject?.code,
          sessionName: session?.name ?? 'Unknown',
          sessionType: session?.type,
        };
      }),
    );

    return {
      ...student,
      section: section
        ? { _id: section._id, name: section.name, displayName: section.displayName }
        : null,
      grade: grade ? { _id: grade._id, name: grade.name, level: grade.level } : null,
      academicYear: academicYear
        ? { _id: academicYear._id, year: academicYear.year, label: academicYear.label }
        : null,
      guardians,
      attendanceSummary,
      recentResults: resultsWithSubjects,
    };
  },
});

/**
 * Search and list students with filtering and pagination.
 * Returns lightweight student records for the list view.
 */
export const searchStudents = query({
  args: {
    search: v.optional(v.string()),
    gradeId: v.optional(v.id('grades')),
    sectionId: v.optional(v.id('sections')),
    status: v.optional(
      v.union(
        v.literal('active'),
        v.literal('transferred_out'),
        v.literal('graduated'),
        v.literal('withdrawn'),
        v.literal('deceased'),
      ),
    ),
    boardingStatus: v.optional(v.union(v.literal('day'), v.literal('boarding'))),
    gender: v.optional(v.union(v.literal('M'), v.literal('F'))),
    limit: v.optional(v.number()),
    cursor: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);
    const rawLimit = args.limit ?? 50;
    const pageSize = Math.max(1, Math.min(100, Math.floor(rawLimit)));

    // Start with school-scoped query
    let studentsQuery;

    if (args.sectionId) {
      const section = await ctx.db.get(args.sectionId);
      if (!section || section.schoolId !== school._id) {
        throwEduError(EduError.NOT_FOUND, 'Section not found.');
      }
      studentsQuery = ctx.db
        .query('students')
        .withIndex('by_section', (q) => q.eq('currentSectionId', args.sectionId!));
    } else if (args.status) {
      studentsQuery = ctx.db
        .query('students')
        .withIndex('by_school_status', (q) =>
          q.eq('schoolId', school._id).eq('status', args.status!),
        );
    } else {
      studentsQuery = ctx.db
        .query('students')
        .withIndex('by_school', (q) => q.eq('schoolId', school._id));
    }

    // Collect and apply client-side filters
    let students = await studentsQuery.collect();

    // Filter by grade
    if (args.gradeId) {
      students = students.filter((s) => s.currentGradeId === args.gradeId);
    }

    // Filter by status (if not already applied via index)
    if (args.status && !args.sectionId) {
      // Already filtered via index
    } else if (args.status) {
      students = students.filter((s) => s.status === args.status);
    }

    // Filter by boarding status
    if (args.boardingStatus) {
      students = students.filter((s) => s.boardingStatus === args.boardingStatus);
    }

    // Filter by gender
    if (args.gender) {
      students = students.filter((s) => s.gender === args.gender);
    }

    // Search filter
    if (args.search && args.search.trim()) {
      const searchLower = args.search.trim().toLowerCase();
      students = students.filter(
        (s) =>
          s.firstName.toLowerCase().includes(searchLower) ||
          s.lastName.toLowerCase().includes(searchLower) ||
          s.studentNumber.toLowerCase().includes(searchLower) ||
          (s.middleName && s.middleName.toLowerCase().includes(searchLower)),
      );
    }

    // Sort by name
    students.sort((a, b) => {
      const nameA = `${a.lastName} ${a.firstName}`.toLowerCase();
      const nameB = `${b.lastName} ${b.firstName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });

    // Simple offset-based pagination using cursor as offset
    const parsedOffset = args.cursor ? parseInt(args.cursor, 10) : 0;
    const offset = Number.isNaN(parsedOffset) || parsedOffset < 0 ? 0 : parsedOffset;
    const totalCount = students.length;
    const page = students.slice(offset, offset + pageSize);
    const nextCursor = offset + pageSize < totalCount ? String(offset + pageSize) : undefined;

    // Resolve grade and section names for each student
    const enrichedPage = await Promise.all(
      page.map(async (student) => {
        const grade = await ctx.db.get(student.currentGradeId);
        const section = await ctx.db.get(student.currentSectionId);

        // Get primary guardian phone
        let guardianPhone: string | undefined;
        const primaryLink = student.guardianLinks?.find((l) => l.isPrimary);
        if (primaryLink) {
          const guardian = await ctx.db.get(primaryLink.guardianId);
          guardianPhone = guardian?.phone;
        } else if (student.guardianLinks?.length > 0) {
          const guardian = await ctx.db.get(student.guardianLinks[0].guardianId);
          guardianPhone = guardian?.phone;
        }

        return {
          _id: student._id,
          firstName: student.firstName,
          lastName: student.lastName,
          middleName: student.middleName,
          studentNumber: student.studentNumber,
          photoUrl: student.photoUrl,
          gender: student.gender,
          status: student.status,
          boardingStatus: student.boardingStatus,
          dateOfBirth: student.dateOfBirth,
          gradeName: grade?.name ?? '',
          gradeLevel: grade?.level ?? 0,
          sectionName: section?.displayName ?? '',
          sectionId: student.currentSectionId,
          gradeId: student.currentGradeId,
          guardianPhone,
        };
      }),
    );

    return {
      students: enrichedPage,
      totalCount,
      nextCursor,
      hasMore: !!nextCursor,
    };
  },
});

/**
 * Get all students in a specific section.
 */
export const getStudentsBySection = query({
  args: {
    sectionId: v.id('sections'),
  },
  handler: async (ctx, args) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    const section = await ctx.db.get(args.sectionId);
    if (!section || section.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Section not found.');
    }

    const students = await ctx.db
      .query('students')
      .withIndex('by_section', (q) => q.eq('currentSectionId', args.sectionId))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect();

    return students
      .map((s) => ({
        _id: s._id,
        firstName: s.firstName,
        lastName: s.lastName,
        studentNumber: s.studentNumber,
        photoUrl: s.photoUrl,
        gender: s.gender,
        boardingStatus: s.boardingStatus,
      }))
      .sort((a, b) => `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`));
  },
});

/**
 * Get student counts per grade — used by dashboard/stats.
 */
export const getStudentCountsByGrade = query({
  args: {},
  handler: async (ctx) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    const grades = await ctx.db
      .query('grades')
      .withIndex('by_school', (q) => q.eq('schoolId', school._id))
      .collect();

    const counts = await Promise.all(
      grades.map(async (grade) => {
        // Count active students in this grade for the current academic year
        const students = await ctx.db
          .query('students')
          .withIndex('by_school_status', (q) =>
            q.eq('schoolId', school._id).eq('status', 'active'),
          )
          .filter((q) => q.eq(q.field('currentGradeId'), grade._id))
          .collect();

        return {
          gradeId: grade._id,
          gradeName: grade.name,
          gradeLevel: grade.level,
          count: students.length,
        };
      }),
    );

    return counts.sort((a, b) => a.gradeLevel - b.gradeLevel);
  },
});

/**
 * Get total student statistics for the school.
 */
export const getStudentStats = query({
  args: {},
  handler: async (ctx) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    const allStudents = await ctx.db
      .query('students')
      .withIndex('by_school', (q) => q.eq('schoolId', school._id))
      .collect();

    const active = allStudents.filter((s) => s.status === 'active').length;
    const transferred = allStudents.filter((s) => s.status === 'transferred_out').length;
    const graduated = allStudents.filter((s) => s.status === 'graduated').length;
    const withdrawn = allStudents.filter((s) => s.status === 'withdrawn').length;
    const boarding = allStudents.filter(
      (s) => s.status === 'active' && s.boardingStatus === 'boarding',
    ).length;
    const day = allStudents.filter(
      (s) => s.status === 'active' && s.boardingStatus === 'day',
    ).length;
    const male = allStudents.filter((s) => s.status === 'active' && s.gender === 'M').length;
    const female = allStudents.filter((s) => s.status === 'active' && s.gender === 'F').length;

    return {
      total: allStudents.length,
      active,
      transferred,
      graduated,
      withdrawn,
      boarding,
      day,
      male,
      female,
    };
  },
});
