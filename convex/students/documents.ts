import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { requirePermission } from '../_lib/permissions';
import { getAuthenticatedUserAndSchool } from '../_lib/schoolContext';
import { Permission } from '../../src/lib/roles/types';
import { EduError, throwEduError } from '../_lib/errors';

// ── ISSUE-052 · Student Document Management ─────────────────────────────────

/**
 * Save a document record after the file has been uploaded to Convex storage.
 */
export const uploadDocument = mutation({
  args: {
    studentId: v.id('students'),
    type: v.union(
      v.literal('birth_certificate'),
      v.literal('nrc'),
      v.literal('medical_certificate'),
      v.literal('transfer_letter'),
      v.literal('report_card'),
      v.literal('id_photo'),
      v.literal('other'),
    ),
    title: v.string(),
    storageId: v.id('_storage'),
    fileType: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { user, school } = await requirePermission(ctx, Permission.EDIT_STUDENT);

    const student = await ctx.db.get(args.studentId);
    if (!student || student.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Student not found.');
    }

    const docId = await ctx.db.insert('studentDocuments', {
      schoolId: school._id,
      studentId: args.studentId,
      type: args.type,
      title: args.title.trim(),
      storageId: args.storageId,
      fileType: args.fileType,
      uploadedBy: user._id,
      uploadedAt: Date.now(),
      notes: args.notes?.trim(),
    });

    return docId;
  },
});

/**
 * Get all documents for a student.
 */
export const getDocumentsByStudent = query({
  args: {
    studentId: v.id('students'),
  },
  handler: async (ctx, args) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    const student = await ctx.db.get(args.studentId);
    if (!student || student.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Student not found.');
    }

    const docs = await ctx.db
      .query('studentDocuments')
      .withIndex('by_student', (q) => q.eq('studentId', args.studentId))
      .collect();

    // Resolve file URLs and uploader names
    const enriched = await Promise.all(
      docs.map(async (doc) => {
        const fileUrl = await ctx.storage.getUrl(doc.storageId);
        const uploader = await ctx.db.get(doc.uploadedBy);
        return {
          ...doc,
          fileUrl,
          uploadedByName: uploader?.name ?? 'Unknown',
        };
      }),
    );

    return enriched.sort((a, b) => b.uploadedAt - a.uploadedAt);
  },
});

/**
 * Delete a student document (removes from storage and database).
 */
export const deleteDocument = mutation({
  args: {
    documentId: v.id('studentDocuments'),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.EDIT_STUDENT);

    const doc = await ctx.db.get(args.documentId);
    if (!doc || doc.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Document not found.');
    }

    // Delete from Convex storage
    await ctx.storage.delete(doc!.storageId);

    // Delete the record
    await ctx.db.delete(args.documentId);
  },
});
