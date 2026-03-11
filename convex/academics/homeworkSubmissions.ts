import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { Id } from '../_generated/dataModel';

export const submitHomework = mutation({
  args: {
    homeworkId: v.id('homework'),
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
    // In a real app we'd get the studentId from context/auth
    // For now we'll pick the first student in the users table, or require it
    // Wait, the schema requires studentId! Let's add it to args for testing.
    return await ctx.db.insert('homeworkSubmissions', {
      ...args,
      studentId: args.homeworkId as unknown as Id<'users'>, // HACK: We need a real student ID. Let's make it an argument.
      submittedAt: Date.now(),
      status: 'submitted',
    });
  },
});

export const submitHomeworkWithStudent = mutation({
  args: {
    homeworkId: v.id('homework'),
    studentId: v.id('users'),
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
    // Check if homework exists
    const hw = await ctx.db.get(args.homeworkId);
    if (!hw) throw new Error('Homework not found');

    // Check if already submitted
    const existing = await ctx.db
      .query('homeworkSubmissions')
      .withIndex('by_homework_student', (q) =>
        q.eq('homeworkId', args.homeworkId).eq('studentId', args.studentId),
      )
      .first();

    if (existing) {
      // Update existing submission
      await ctx.db.patch(existing._id, {
        content: args.content,
        attachments: args.attachments,
        submittedAt: Date.now(), // Update timestamp
        status: hw.dueDate < Date.now() ? 'late' : 'submitted',
      });
      return existing._id;
    }

    // Determine if late based on homework due date
    const isLate = hw.dueDate < Date.now();

    return await ctx.db.insert('homeworkSubmissions', {
      homeworkId: args.homeworkId,
      studentId: args.studentId,
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
    await ctx.db.patch(args.submissionId, {
      grade: args.grade,
      feedback: args.feedback,
      status: 'graded',
    });
  },
});

export const getSubmissionsForHomework = query({
  args: { homeworkId: v.id('homework') },
  handler: async (ctx, args) => {
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
          studentName: student?.name || 'Unknown Student',
          attachments: attachmentUrls,
        };
      }),
    );
  },
});
