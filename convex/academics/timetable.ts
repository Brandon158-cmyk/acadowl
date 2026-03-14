import { v } from 'convex/values';
import { mutation, query } from '../_generated/server';
import { getAuthenticatedUserAndSchool } from '../_lib/schoolContext';
import { requirePermission } from '../_lib/permissions';
import { Permission } from '../../src/lib/roles/types';
import { EduError, throwEduError } from '../_lib/errors';
import { Id } from '../_generated/dataModel';

// ── ISSUE-062 · Timetable Slot Management ──

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Check if two time ranges overlap.
 * Ranges [startA, endA) and [startB, endB) overlap if startA < endB && startB < endA.
 */
function timesOverlap(startA: string, endA: string, startB: string, endB: string): boolean {
  return startA < endB && startB < endA;
}

interface ConflictDetail {
  type: 'teacher' | 'room';
  conflictSlotId: string;
  sectionName: string;
  subjectName: string;
  staffName: string;
  room?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
}

// ── Mutations ────────────────────────────────────────────────────────────────

/**
 * Create a timetable slot with teacher and room conflict detection.
 */
export const createTimetableSlot = mutation({
  args: {
    sectionId: v.id('sections'),
    subjectId: v.id('subjects'),
    staffId: v.id('staff'),
    dayOfWeek: v.number(),
    startTime: v.string(),
    endTime: v.string(),
    room: v.optional(v.string()),
    termId: v.id('terms'),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.MANAGE_SCHOOL_SETTINGS);

    // Validate dayOfWeek 0-6
    if (args.dayOfWeek < 0 || args.dayOfWeek > 6) {
      throwEduError(EduError.VALIDATION_ERROR, 'Day of week must be 0 (Monday) to 6 (Sunday).');
    }

    // Validate time format
    if (!/^\d{2}:\d{2}$/.test(args.startTime) || !/^\d{2}:\d{2}$/.test(args.endTime)) {
      throwEduError(EduError.VALIDATION_ERROR, 'Times must be in HH:MM format.');
    }

    if (args.startTime >= args.endTime) {
      throwEduError(EduError.VALIDATION_ERROR, 'Start time must be before end time.');
    }

    // Validate entities belong to this school
    const section = await ctx.db.get(args.sectionId);
    if (!section || section.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Section not found.');
    }

    const subject = await ctx.db.get(args.subjectId);
    if (!subject || subject.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Subject not found.');
    }

    const staff = await ctx.db.get(args.staffId);
    if (!staff || staff.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Staff member not found.');
    }

    const term = await ctx.db.get(args.termId);
    if (!term || term.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Term not found.');
    }

    // Check teacher conflict: same staffId, same day, overlapping time, same term
    const staffSlots = await ctx.db
      .query('timetableSlots')
      .withIndex('by_staff', (q) => q.eq('staffId', args.staffId))
      .filter((q) =>
        q.and(
          q.eq(q.field('termId'), args.termId),
          q.eq(q.field('dayOfWeek'), args.dayOfWeek),
        ),
      )
      .collect();

    for (const slot of staffSlots) {
      if (timesOverlap(args.startTime, args.endTime, slot.startTime, slot.endTime)) {
        const conflictSection = await ctx.db.get(slot.sectionId);
        const conflictSubject = await ctx.db.get(slot.subjectId);
        throwEduError(
          EduError.CONFLICT,
          `Teacher conflict: ${staff.firstName} ${staff.lastName} is already teaching ${conflictSubject?.name ?? 'Unknown'} in ${conflictSection?.displayName ?? 'Unknown'} at ${slot.startTime}–${slot.endTime}.`,
        );
      }
    }

    // Check room conflict: same room, same day, overlapping time, same term
    if (args.room) {
      const roomSlots = await ctx.db
        .query('timetableSlots')
        .withIndex('by_school', (q) => q.eq('schoolId', school._id))
        .filter((q) =>
          q.and(
            q.eq(q.field('termId'), args.termId),
            q.eq(q.field('dayOfWeek'), args.dayOfWeek),
            q.eq(q.field('room'), args.room),
          ),
        )
        .collect();

      for (const slot of roomSlots) {
        if (timesOverlap(args.startTime, args.endTime, slot.startTime, slot.endTime)) {
          const conflictSection = await ctx.db.get(slot.sectionId);
          const conflictSubject = await ctx.db.get(slot.subjectId);
          throwEduError(
            EduError.CONFLICT,
            `Room conflict: ${args.room} is already booked for ${conflictSubject?.name ?? 'Unknown'} (${conflictSection?.displayName ?? 'Unknown'}) at ${slot.startTime}–${slot.endTime}.`,
          );
        }
      }
    }

    // Check section slot conflict: same section, same day, overlapping time, same term
    const sectionSlots = await ctx.db
      .query('timetableSlots')
      .withIndex('by_section_term', (q) =>
        q.eq('sectionId', args.sectionId).eq('termId', args.termId),
      )
      .filter((q) => q.eq(q.field('dayOfWeek'), args.dayOfWeek))
      .collect();

    for (const slot of sectionSlots) {
      if (timesOverlap(args.startTime, args.endTime, slot.startTime, slot.endTime)) {
        const conflictSubject = await ctx.db.get(slot.subjectId);
        throwEduError(
          EduError.CONFLICT,
          `Slot conflict: ${section.displayName} already has ${conflictSubject?.name ?? 'a subject'} at ${slot.startTime}–${slot.endTime}.`,
        );
      }
    }

    const slotId = await ctx.db.insert('timetableSlots', {
      schoolId: school._id,
      sectionId: args.sectionId,
      subjectId: args.subjectId,
      staffId: args.staffId,
      dayOfWeek: args.dayOfWeek,
      startTime: args.startTime,
      endTime: args.endTime,
      room: args.room,
      termId: args.termId,
      isPublished: false,
      notes: args.notes,
    });

    return slotId;
  },
});

/**
 * Update an existing timetable slot. Re-runs conflict detection.
 */
export const updateTimetableSlot = mutation({
  args: {
    slotId: v.id('timetableSlots'),
    subjectId: v.optional(v.id('subjects')),
    staffId: v.optional(v.id('staff')),
    dayOfWeek: v.optional(v.number()),
    startTime: v.optional(v.string()),
    endTime: v.optional(v.string()),
    room: v.optional(v.string()),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.MANAGE_SCHOOL_SETTINGS);

    const slot = await ctx.db.get(args.slotId);
    if (!slot || slot.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Timetable slot not found.');
    }

    const newStaffId = args.staffId ?? slot.staffId;
    const newDayOfWeek = args.dayOfWeek ?? slot.dayOfWeek;
    const newStartTime = args.startTime ?? slot.startTime;
    const newEndTime = args.endTime ?? slot.endTime;
    const newRoom = args.room !== undefined ? args.room : slot.room;

    // Time validation
    if (newStartTime >= newEndTime) {
      throwEduError(EduError.VALIDATION_ERROR, 'Start time must be before end time.');
    }

    // Teacher conflict check (excluding self)
    const staffSlots = await ctx.db
      .query('timetableSlots')
      .withIndex('by_staff', (q) => q.eq('staffId', newStaffId))
      .filter((q) =>
        q.and(
          q.eq(q.field('termId'), slot.termId),
          q.eq(q.field('dayOfWeek'), newDayOfWeek),
          q.neq(q.field('_id'), args.slotId),
        ),
      )
      .collect();

    for (const other of staffSlots) {
      if (timesOverlap(newStartTime, newEndTime, other.startTime, other.endTime)) {
        const staff = await ctx.db.get(newStaffId);
        const conflictSection = await ctx.db.get(other.sectionId);
        const conflictSubject = await ctx.db.get(other.subjectId);
        throwEduError(
          EduError.CONFLICT,
          `Teacher conflict: ${staff?.firstName} ${staff?.lastName} is already teaching ${conflictSubject?.name ?? 'Unknown'} in ${conflictSection?.displayName ?? 'Unknown'} at ${other.startTime}–${other.endTime}.`,
        );
      }
    }

    // Room conflict check (excluding self)
    if (newRoom) {
      const roomSlots = await ctx.db
        .query('timetableSlots')
        .withIndex('by_school', (q) => q.eq('schoolId', school._id))
        .filter((q) =>
          q.and(
            q.eq(q.field('termId'), slot.termId),
            q.eq(q.field('dayOfWeek'), newDayOfWeek),
            q.eq(q.field('room'), newRoom),
            q.neq(q.field('_id'), args.slotId),
          ),
        )
        .collect();

      for (const other of roomSlots) {
        if (timesOverlap(newStartTime, newEndTime, other.startTime, other.endTime)) {
          throwEduError(
            EduError.CONFLICT,
            `Room conflict: ${newRoom} is already booked at ${other.startTime}–${other.endTime}.`,
          );
        }
      }
    }

    // Section slot conflict check (excluding self)
    const sectionSlots = await ctx.db
      .query('timetableSlots')
      .withIndex('by_section_term', (q) =>
        q.eq('sectionId', slot.sectionId).eq('termId', slot.termId),
      )
      .filter((q) =>
        q.and(
          q.eq(q.field('dayOfWeek'), newDayOfWeek),
          q.neq(q.field('_id'), args.slotId),
        ),
      )
      .collect();

    for (const other of sectionSlots) {
      if (timesOverlap(newStartTime, newEndTime, other.startTime, other.endTime)) {
        const conflictSubject = await ctx.db.get(other.subjectId);
        throwEduError(
          EduError.CONFLICT,
          `Slot conflict: section already has ${conflictSubject?.name ?? 'a subject'} at ${other.startTime}–${other.endTime}.`,
        );
      }
    }

    const patch: Record<string, unknown> = {};
    if (args.subjectId !== undefined) patch.subjectId = args.subjectId;
    if (args.staffId !== undefined) patch.staffId = args.staffId;
    if (args.dayOfWeek !== undefined) patch.dayOfWeek = args.dayOfWeek;
    if (args.startTime !== undefined) patch.startTime = args.startTime;
    if (args.endTime !== undefined) patch.endTime = args.endTime;
    if (args.room !== undefined) patch.room = args.room;
    if (args.notes !== undefined) patch.notes = args.notes;

    await ctx.db.patch(args.slotId, patch);
  },
});

/**
 * Delete a timetable slot.
 */
export const deleteTimetableSlot = mutation({
  args: {
    slotId: v.id('timetableSlots'),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.MANAGE_SCHOOL_SETTINGS);

    const slot = await ctx.db.get(args.slotId);
    if (!slot || slot.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Timetable slot not found.');
    }

    await ctx.db.delete(args.slotId);
  },
});

// ── Queries ──────────────────────────────────────────────────────────────────

/**
 * Get full week timetable for a section.
 * Returns slots enriched with subject name, teacher name, grouped by day.
 */
export const getTimetableForSection = query({
  args: {
    sectionId: v.id('sections'),
    termId: v.id('terms'),
  },
  handler: async (ctx, args) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    const section = await ctx.db.get(args.sectionId);
    if (!section || section.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Section not found.');
    }

    const slots = await ctx.db
      .query('timetableSlots')
      .withIndex('by_section_term', (q) =>
        q.eq('sectionId', args.sectionId).eq('termId', args.termId),
      )
      .collect();

    const enriched = await Promise.all(
      slots.map(async (slot) => {
        const subject = await ctx.db.get(slot.subjectId);
        const staff = await ctx.db.get(slot.staffId);
        return {
          ...slot,
          subjectName: subject?.name ?? 'Unknown',
          subjectCode: subject?.code ?? '',
          staffFirstName: staff?.firstName ?? 'Unknown',
          staffLastName: staff?.lastName ?? 'Unknown',
        };
      }),
    );

    return enriched.sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
      return a.startTime.localeCompare(b.startTime);
    });
  },
});

/**
 * Get full week timetable for a teacher across all their sections.
 */
export const getTimetableForStaff = query({
  args: {
    staffId: v.id('staff'),
    termId: v.id('terms'),
  },
  handler: async (ctx, args) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    const staff = await ctx.db.get(args.staffId);
    if (!staff || staff.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Staff member not found.');
    }

    const slots = await ctx.db
      .query('timetableSlots')
      .withIndex('by_staff', (q) => q.eq('staffId', args.staffId))
      .filter((q) => q.eq(q.field('termId'), args.termId))
      .collect();

    const enriched = await Promise.all(
      slots.map(async (slot) => {
        const subject = await ctx.db.get(slot.subjectId);
        const section = await ctx.db.get(slot.sectionId);
        const grade = section ? await ctx.db.get(section.gradeId) : null;
        return {
          ...slot,
          subjectName: subject?.name ?? 'Unknown',
          subjectCode: subject?.code ?? '',
          sectionDisplayName: section?.displayName ?? 'Unknown',
          gradeName: grade?.name ?? 'Unknown',
        };
      }),
    );

    return enriched.sort((a, b) => {
      if (a.dayOfWeek !== b.dayOfWeek) return a.dayOfWeek - b.dayOfWeek;
      return a.startTime.localeCompare(b.startTime);
    });
  },
});

/**
 * Scan for ALL conflicts in a section's timetable for a given term.
 * Returns teacher conflicts and room conflicts.
 */
export const getConflicts = query({
  args: {
    sectionId: v.id('sections'),
    termId: v.id('terms'),
  },
  handler: async (ctx, args) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    const section = await ctx.db.get(args.sectionId);
    if (!section || section.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Section not found.');
    }

    // Get all slots for this section
    const sectionSlots = await ctx.db
      .query('timetableSlots')
      .withIndex('by_section_term', (q) =>
        q.eq('sectionId', args.sectionId).eq('termId', args.termId),
      )
      .collect();

    const conflicts: ConflictDetail[] = [];

    for (const slot of sectionSlots) {
      // Check teacher conflicts across other sections
      const staffSlots = await ctx.db
        .query('timetableSlots')
        .withIndex('by_staff', (q) => q.eq('staffId', slot.staffId))
        .filter((q) =>
          q.and(
            q.eq(q.field('termId'), args.termId),
            q.eq(q.field('dayOfWeek'), slot.dayOfWeek),
            q.neq(q.field('_id'), slot._id),
          ),
        )
        .collect();

      for (const other of staffSlots) {
        if (timesOverlap(slot.startTime, slot.endTime, other.startTime, other.endTime)) {
          const otherSection = await ctx.db.get(other.sectionId);
          const otherSubject = await ctx.db.get(other.subjectId);
          const staff = await ctx.db.get(slot.staffId);
          conflicts.push({
            type: 'teacher',
            conflictSlotId: other._id,
            sectionName: otherSection?.displayName ?? 'Unknown',
            subjectName: otherSubject?.name ?? 'Unknown',
            staffName: `${staff?.firstName ?? ''} ${staff?.lastName ?? ''}`.trim(),
            dayOfWeek: slot.dayOfWeek,
            startTime: slot.startTime,
            endTime: slot.endTime,
          });
        }
      }

      // Check room conflicts
      if (slot.room) {
        const roomSlots = await ctx.db
          .query('timetableSlots')
          .withIndex('by_school', (q) => q.eq('schoolId', school._id))
          .filter((q) =>
            q.and(
              q.eq(q.field('termId'), args.termId),
              q.eq(q.field('dayOfWeek'), slot.dayOfWeek),
              q.eq(q.field('room'), slot.room),
              q.neq(q.field('_id'), slot._id),
            ),
          )
          .collect();

        for (const other of roomSlots) {
          if (timesOverlap(slot.startTime, slot.endTime, other.startTime, other.endTime)) {
            const otherSection = await ctx.db.get(other.sectionId);
            const otherSubject = await ctx.db.get(other.subjectId);
            const staff = await ctx.db.get(other.staffId);
            conflicts.push({
              type: 'room',
              conflictSlotId: other._id,
              sectionName: otherSection?.displayName ?? 'Unknown',
              subjectName: otherSubject?.name ?? 'Unknown',
              staffName: `${staff?.firstName ?? ''} ${staff?.lastName ?? ''}`.trim(),
              room: slot.room,
              dayOfWeek: slot.dayOfWeek,
              startTime: other.startTime,
              endTime: other.endTime,
            });
          }
        }
      }
    }

    return conflicts;
  },
});

/**
 * Publish all timetable slots for a section + term.
 * Published timetables are visible to students and parents.
 */
export const publishTimetable = mutation({
  args: {
    sectionId: v.id('sections'),
    termId: v.id('terms'),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.MANAGE_SCHOOL_SETTINGS);

    const section = await ctx.db.get(args.sectionId);
    if (!section || section.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Section not found.');
    }

    const slots = await ctx.db
      .query('timetableSlots')
      .withIndex('by_section_term', (q) =>
        q.eq('sectionId', args.sectionId).eq('termId', args.termId),
      )
      .collect();

    if (slots.length === 0) {
      throwEduError(EduError.VALIDATION_ERROR, 'No timetable slots to publish for this section.');
    }

    // Publish all slots
    for (const slot of slots) {
      await ctx.db.patch(slot._id, { isPublished: true });
    }

    return { published: slots.length };
  },
});

/**
 * Unpublish all timetable slots for a section + term.
 */
export const unpublishTimetable = mutation({
  args: {
    sectionId: v.id('sections'),
    termId: v.id('terms'),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.MANAGE_SCHOOL_SETTINGS);

    const section = await ctx.db.get(args.sectionId);
    if (!section || section.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Section not found.');
    }

    const slots = await ctx.db
      .query('timetableSlots')
      .withIndex('by_section_term', (q) =>
        q.eq('sectionId', args.sectionId).eq('termId', args.termId),
      )
      .collect();

    for (const slot of slots) {
      await ctx.db.patch(slot._id, { isPublished: false });
    }

    return { unpublished: slots.length };
  },
});

/**
 * Copy all timetable slots from one term to another for the entire school.
 * Existing slots in the target term are NOT overwritten — only sections with no slots are copied.
 */
export const copyTimetableToNextTerm = mutation({
  args: {
    fromTermId: v.id('terms'),
    toTermId: v.id('terms'),
  },
  handler: async (ctx, args) => {
    const { school } = await requirePermission(ctx, Permission.MANAGE_SCHOOL_SETTINGS);

    if (args.fromTermId === args.toTermId) {
      throwEduError(EduError.VALIDATION_ERROR, 'Source and target term cannot be the same.');
    }

    const fromTerm = await ctx.db.get(args.fromTermId);
    if (!fromTerm || fromTerm.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Source term not found.');
    }

    const toTerm = await ctx.db.get(args.toTermId);
    if (!toTerm || toTerm.schoolId !== school._id) {
      throwEduError(EduError.NOT_FOUND, 'Target term not found.');
    }

    // Get all slots from source term
    const sourceSlots = await ctx.db
      .query('timetableSlots')
      .withIndex('by_school', (q) => q.eq('schoolId', school._id))
      .filter((q) => q.eq(q.field('termId'), args.fromTermId))
      .collect();

    if (sourceSlots.length === 0) {
      throwEduError(EduError.VALIDATION_ERROR, 'No timetable slots found in the source term.');
    }

    // Check which sections already have slots in target term
    const targetSlots = await ctx.db
      .query('timetableSlots')
      .withIndex('by_school', (q) => q.eq('schoolId', school._id))
      .filter((q) => q.eq(q.field('termId'), args.toTermId))
      .collect();

    const targetSections = new Set(targetSlots.map((s) => s.sectionId));

    let copied = 0;
    let skipped = 0;

    for (const slot of sourceSlots) {
      if (targetSections.has(slot.sectionId)) {
        skipped++;
        continue;
      }

      await ctx.db.insert('timetableSlots', {
        schoolId: school._id,
        sectionId: slot.sectionId,
        subjectId: slot.subjectId,
        staffId: slot.staffId,
        dayOfWeek: slot.dayOfWeek,
        startTime: slot.startTime,
        endTime: slot.endTime,
        room: slot.room,
        termId: args.toTermId,
        isPublished: false,
        week: slot.week,
        notes: slot.notes,
      });
      copied++;
    }

    return { copied, skipped };
  },
});

/**
 * Get all sections that have timetable data for a term (for the section selector).
 */
export const getSectionsWithTimetable = query({
  args: {
    termId: v.id('terms'),
  },
  handler: async (ctx, args) => {
    const { school } = await getAuthenticatedUserAndSchool(ctx);

    const slots = await ctx.db
      .query('timetableSlots')
      .withIndex('by_school', (q) => q.eq('schoolId', school._id))
      .filter((q) => q.eq(q.field('termId'), args.termId))
      .collect();

    const sectionIds = [...new Set(slots.map((s) => s.sectionId))];

    const sections = await Promise.all(
      sectionIds.map(async (id) => {
        const section = await ctx.db.get(id);
        if (!section) return null;
        const grade = await ctx.db.get(section.gradeId);
        const sectionSlots = slots.filter((s) => s.sectionId === id);
        const isPublished = sectionSlots.every((s) => s.isPublished);
        return {
          _id: section._id,
          displayName: section.displayName,
          gradeName: grade?.name ?? 'Unknown',
          gradeLevel: grade?.level ?? 0,
          slotCount: sectionSlots.length,
          isPublished,
        };
      }),
    );

    return sections
      .filter((s): s is NonNullable<typeof s> => s !== null)
      .sort((a, b) => a.gradeLevel - b.gradeLevel || a.displayName.localeCompare(b.displayName));
  },
});
