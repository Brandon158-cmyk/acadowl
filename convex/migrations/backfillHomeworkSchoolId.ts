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
    let deleted = 0;
    let cursor: string | null = null;

    // Process in pages of 50 to stay within Convex's query-result limits.
    do {
      const page = await ctx.db
        .query('homework')
        .paginate({ numItems: 50, cursor: cursor ?? 'null' });

      for (const hw of page.page) {
        if (!('schoolId' in hw) || hw.schoolId == null) {
          console.log(`Deleting orphaned homework: ${hw._id} ("${hw.title}")`);
          await ctx.db.delete(hw._id);
          deleted++;
        }
      }

      cursor = page.isDone ? null : page.continueCursor;
    } while (cursor !== null);

    return { deleted };
  },
});
