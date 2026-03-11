'use client';

import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';

/**
 * ISSUE-015 · useMe hook
 *
 * Returns the current authenticated user's full profile
 * including their role, linked staff/guardian/student record, and school.
 *
 * @example
 * const me = useMe();
 * if (me?.user.role === 'teacher') { ... }
 */
export function useMe() {
  const result = useQuery(api.users.queries.getMe);
  return result;
}
