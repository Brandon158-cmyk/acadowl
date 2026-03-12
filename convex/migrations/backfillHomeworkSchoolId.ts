/**
 * One-off migration: delete homework documents that are missing `schoolId`.
 *
 * These are orphaned test records created before `schoolId` became required.
 * Run once from the Convex dashboard → Functions tab, or via the CLI:
 *   npx convex run migrations/backfillHomeworkSchoolId:deleteOrphans
 *
 * Safe to run multiple times (idempotent).
 */
import { internalMutation } from '../_generated/server';

export const deleteOrphans = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Collect all homework docs — we can't filter on missing fields via index
    const all = await ctx.db.query('homework').collect();

    const orphans = all.filter((hw) => !('schoolId' in hw) || hw.schoolId == null);

    for (const hw of orphans) {
      console.log(`Deleting orphaned homework: ${hw._id} ("${hw.title}")`);
      await ctx.db.delete(hw._id);
    }

    return { deleted: orphans.length };
  },
});
