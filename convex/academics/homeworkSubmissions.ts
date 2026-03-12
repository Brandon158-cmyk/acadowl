import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import { getAuthenticatedUserAndSchool } from '../_lib/schoolContext';
import { requireRole } from '../_lib/permissions';
import { EduError, throwEduError } from '../_lib/errors';

// submitHomework was removed — it had a data-corrupting bug (cast homeworkId as studentId).
// Use submitHomeworkWithStudent instead.

export const submitHomeworkWithStudent = mutation({
  args: {
    homeworkId: v.id('homework'),
    studentId: v.id('students'),
    content: v.optional(v.string()),
    attachments: v.optional(
      v.array(
        v.object({
          title: v.string(),
          storageId: v.optional(v.id('_storage')),
        }),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    // Check if homework exists and belongs to school
    const hw = await ctx.db.get(args.homeworkId);
    if (!hw || hw.schoolId !== school._id) throwEduError(EduError.NOT_FOUND, 'Homework not found');

    // Verify the student exists and belongs to the same school
    const student = await ctx.db.get(args.studentId);
    if (!student || student.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Student not found');
    }

    // Check if already submitted
    const existing = await ctx.db
      .query('homeworkSubmissions')
      .withIndex('by_homework_student', (q) =>
        q.eq('homeworkId', args.homeworkId).eq('studentId', args.studentId),
      )
      .first();

    if (existing) {
      // Block resubmission once a submission has been graded — preserve the grade.
      if (existing.status === 'graded') {
        throw new Error('Resubmission is not allowed after a submission has been graded.');
      }
      // Update existing (ungraded) submission
      await ctx.db.patch(existing._id, {
        content: args.content,
        attachments: args.attachments,
        submittedAt: Date.now(),
        status: hw.dueDate < Date.now() ? 'late' : 'submitted',
      });
      return existing._id;
    }

    // Determine if late based on homework due date
    const isLate = hw.dueDate < Date.now();

    return await ctx.db.insert('homeworkSubmissions', {
      homeworkId: args.homeworkId,
      studentId: args.studentId,
      schoolId: school._id,
      content: args.content,
      attachments: args.attachments,
      submittedAt: Date.now(),
      status: isLate ? 'late' : 'submitted',
    });
  },
});

export const gradeSubmission = mutation({
  args: {
    submissionId: v.id('homeworkSubmissions'),
    grade: v.number(),
    feedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Only teaching staff and admins may grade submissions
    const { school, user } = await requireRole(ctx, [
      'platform_admin',
      'school_admin',
      'deputy_head',
      'teacher',
      'class_teacher',
    ]);

    // Fetch submission; verify it belongs to the caller's school
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) throwEduError(EduError.NOT_FOUND, 'Submission not found.');
    if (submission.schoolId !== school._id) {
      throwEduError(EduError.FORBIDDEN, 'You do not have permission to grade this submission.');
    }

    // Fetch related homework to get totalPoints for bounds check
    const homework = await ctx.db.get(submission.homeworkId);
    if (!homework) throwEduError(EduError.NOT_FOUND, 'Related homework not found.');

    // Validate grade is within bounds
    const maxPoints = homework.totalPoints ?? 100;
    if (args.grade < 0 || args.grade > maxPoints) {
      throwEduError(EduError.VALIDATION_ERROR, `Grade must be between 0 and ${maxPoints}.`);
    }

    await ctx.db.patch(args.submissionId, {
      grade: args.grade,
      feedback: args.feedback,
      status: 'graded',
      gradedBy: user._id,
      gradedAt: Date.now(), // epoch number, consistent with submittedAt
    });
  },
});

export const getSubmissionsForHomework = query({
  args: { homeworkId: v.id('homework') },
  handler: async (ctx, args) => {
    const { school, user } = await getAuthenticatedUserAndSchool(ctx);

    // Verify the homework belongs to this school
    const homework = await ctx.db.get(args.homeworkId);
    if (!homework || homework.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Homework not found.');
    }

    // Only school admins or staff may view submissions
    const isAdmin = user.role === 'school_admin' || user.role === 'platform_admin';
    if (!isAdmin) {
      const staff = await ctx.db
        .query('staff')
        .withIndex('by_user', (q) => q.eq('userId', user._id))
        .first();
      if (!staff || staff.schoolId !== school._id) {
        throwEduError(EduError.FORBIDDEN, 'Only school staff may view submissions.');
      }
    }

    const submissions = await ctx.db
      .query('homeworkSubmissions')
      .withIndex('by_homework', (q) => q.eq('homeworkId', args.homeworkId))
      .collect();

    // Map student info
    return await Promise.all(
      submissions.map(async (sub) => {
        const student = await ctx.db.get(sub.studentId);

        let attachmentUrls: Array<{
          title: string;
          storageId?: Id<'_storage'>;
          url?: string | null;
        }> = [];
        if (sub.attachments) {
          attachmentUrls = await Promise.all(
            sub.attachments.map(async (res) => {
              if (res.storageId) {
                return { ...res, url: await ctx.storage.getUrl(res.storageId) };
              }
              return res;
            }),
          );
        }

        return {
          ...sub,
          studentName: student ? `${student.firstName} ${student.lastName}` : 'Unknown Student',
          attachments: attachmentUrls,
        };
      }),
    );
  },
});
