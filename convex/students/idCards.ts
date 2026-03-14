import { v } from 'convex/values';
import { query } from '../_generated/server';
import { getAuthenticatedUserAndSchool } from '../_lib/schoolContext';
import { EduError, throwEduError } from '../_lib/errors';

// ── ISSUE-051 · Student ID Card Generation ──────────────────────────────────

/**
 * Get all data needed for client-side ID card PDF rendering.
 * Returns student info, school branding, and photo URL.
 */
export const getIdCardData = query({
  args: {
    studentId: v.id('students'),
  },
  handler: async (ctx, args) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    const student = await ctx.db.get(args.studentId);
    if (!student || student.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Student not found.');
    }

    const grade = await ctx.db.get(student!.currentGradeId);
    const section = await ctx.db.get(student!.currentSectionId);
    const academicYear = await ctx.db.get(student!.currentAcademicYearId);

    // Get primary guardian for emergency contact on back of card
    let guardianPhone: string | undefined;
    let guardianName: string | undefined;
    const primaryLink = student!.guardianLinks?.find((l) => l.isEmergencyContact || l.isPrimary);
    if (primaryLink) {
      const guardian = await ctx.db.get(primaryLink.guardianId);
      if (guardian) {
        guardianPhone = guardian.phone;
        guardianName = `${guardian.firstName} ${guardian.lastName}`;
      }
    }

    return {
      student: {
        firstName: student!.firstName,
        lastName: student!.lastName,
        middleName: student!.middleName,
        studentNumber: student!.studentNumber,
        photoUrl: student!.photoUrl,
        dateOfBirth: student!.dateOfBirth,
        gender: student!.gender,
        bloodGroup: student!.bloodGroup,
        boardingStatus: student!.boardingStatus,
      },
      grade: grade ? { name: grade.name, level: grade.level } : null,
      section: section ? { displayName: section.displayName } : null,
      academicYear: academicYear ? { year: academicYear.year, label: academicYear.label } : null,
      school: {
        name: school.name,
        shortName: school.shortName,
        address: school.address,
        phone: school.phone,
        email: school.email,
        logoUrl: school.branding?.logoUrl,
        primaryColor: school.branding?.primaryColor,
        motto: school.branding?.motto,
      },
      emergencyContact: {
        name: guardianName,
        phone: guardianPhone,
      },
    };
  },
});

/**
 * Get ID card data for multiple students (bulk generation).
 */
export const getBulkIdCardData = query({
  args: {
    studentIds: v.array(v.id('students')),
  },
  handler: async (ctx, args) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    const cards = await Promise.all(
      args.studentIds.map(async (studentId) => {
        const student = await ctx.db.get(studentId);
        if (!student || student.schoolId !== school._id) return null;

        const grade = await ctx.db.get(student.currentGradeId);
        const section = await ctx.db.get(student.currentSectionId);
        const academicYear = await ctx.db.get(student.currentAcademicYearId);

        let guardianPhone: string | undefined;
        let guardianName: string | undefined;
        const primaryLink = student.guardianLinks?.find(
          (l) => l.isEmergencyContact || l.isPrimary,
        );
        if (primaryLink) {
          const guardian = await ctx.db.get(primaryLink.guardianId);
          if (guardian) {
            guardianPhone = guardian.phone;
            guardianName = `${guardian.firstName} ${guardian.lastName}`;
          }
        }

        return {
          student: {
            firstName: student.firstName,
            lastName: student.lastName,
            middleName: student.middleName,
            studentNumber: student.studentNumber,
            photoUrl: student.photoUrl,
            dateOfBirth: student.dateOfBirth,
            gender: student.gender,
            bloodGroup: student.bloodGroup,
            boardingStatus: student.boardingStatus,
          },
          grade: grade ? { name: grade.name, level: grade.level } : null,
          section: section ? { displayName: section.displayName } : null,
          academicYear: academicYear
            ? { year: academicYear.year, label: academicYear.label }
            : null,
          emergencyContact: {
            name: guardianName,
            phone: guardianPhone,
          },
        };
      }),
    );

    return {
      cards: cards.filter(Boolean),
      school: {
        name: school.name,
        shortName: school.shortName,
        address: school.address,
        phone: school.phone,
        email: school.email,
        logoUrl: school.branding?.logoUrl,
        primaryColor: school.branding?.primaryColor,
        motto: school.branding?.motto,
      },
    };
  },
});
