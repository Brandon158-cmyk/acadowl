import { v } from 'convex/values';
import { query } from '../_generated/server';
import { getAuthenticatedUserAndSchool } from '../_lib/schoolContext';
import { EduError, throwEduError } from '../_lib/errors';

// ── ISSUE-058 · Class Teacher Section Dashboard Queries ──

/**
 * Get the class teacher's section overview.
 * Returns section info, student roster, and summary stats.
 */
export const getMyClassOverview = query({
  args: {},
  handler: async (ctx) => {
    const { user, school } = await getAuthenticatedUserAndSchool(ctx);

    // Resolve the staff profile
    if (!user.staffId) {
      return { hasClass: false, reason: 'no_staff_profile' as const };
    }

    const staff = await ctx.db.get(user.staffId);
    if (!staff || !staff.classSectionId) {
      return { hasClass: false, reason: 'no_class_assigned' as const };
    }

    const section = await ctx.db.get(staff.classSectionId);
    if (!section || section.schoolId !== school._id) {
      return { hasClass: false, reason: 'section_not_found' as const };
    }

    const grade = await ctx.db.get(section.gradeId);
    const academicYear = section.academicYearId
      ? await ctx.db.get(section.academicYearId)
      : null;

    // Get all active students in this section
    const students = await ctx.db
      .query('students')
      .withIndex('by_section', (q) => q.eq('currentSectionId', section._id))
      .filter((q) => q.eq(q.field('status'), 'active'))
      .collect();

    // Get gender breakdown
    const maleCount = students.filter((s) => s.gender === 'M').length;
    const femaleCount = students.filter((s) => s.gender === 'F').length;
    const boardingCount = students.filter((s) => s.boardingStatus === 'boarding').length;
    const dayCount = students.filter((s) => s.boardingStatus === 'day').length;

    // Sort students by last name, first name
    const sortedStudents = students
      .map((s) => ({
        _id: s._id,
        studentNumber: s.studentNumber,
        firstName: s.firstName,
        lastName: s.lastName,
        preferredName: s.preferredName,
        gender: s.gender,
        photoUrl: s.photoUrl,
        boardingStatus: s.boardingStatus,
        dateOfBirth: s.dateOfBirth,
        medicalConditions: s.medicalConditions,
        allergies: s.allergies,
        specialNeeds: s.specialNeeds,
      }))
      .sort((a, b) =>
        `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`),
      );

    // Get subject assignments for this section
    const assignments = await ctx.db
      .query('staffSubjectAssignments')
      .withIndex('by_section', (q) => q.eq('sectionId', section._id))
      .collect();

    const teacherSubjects = await Promise.all(
      assignments.map(async (a) => {
        const subject = await ctx.db.get(a.subjectId);
        const teacher = await ctx.db.get(a.staffId);
        return {
          _id: a._id,
          subjectName: subject?.name ?? 'Unknown',
          subjectCode: subject?.code,
          teacherName: teacher
            ? `${teacher.firstName} ${teacher.lastName}`
            : 'Unassigned',
          isPrimaryTeacher: a.isPrimaryTeacher,
          isMe: a.staffId === staff._id,
        };
      }),
    );

    return {
      hasClass: true as const,
      section: {
        _id: section._id,
        displayName: section.displayName,
        capacity: section.capacity,
      },
      grade: {
        _id: grade?._id,
        name: grade?.name ?? 'Unknown',
      },
      academicYear: academicYear
        ? { _id: academicYear._id, label: academicYear.label }
        : null,
      stats: {
        totalStudents: students.length,
        maleCount,
        femaleCount,
        boardingCount,
        dayCount,
      },
      students: sortedStudents,
      subjects: teacherSubjects,
    };
  },
});
