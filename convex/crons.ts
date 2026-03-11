import { cronJobs } from 'convex/server';

/**
 * All scheduled/recurring jobs.
 * Placeholder — actual crons added in Sprint 01+ as needed.
 */
const crons = cronJobs();

// Example: future cron for overdue invoice marking
// crons.daily('mark-overdue-invoices', { hourUTC: 6, minuteUTC: 0 }, api.fees.mutations.markOverdue);

export default crons;
