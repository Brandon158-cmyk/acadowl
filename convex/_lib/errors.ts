import { ConvexError } from 'convex/values';

/**
 * Standardized error class for EduZambia.
 * Used across all Convex functions to throw consistent, typed errors.
 */

/** Error codes used throughout the system */
export const EduError = {
  // Auth errors
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  ACCOUNT_INACTIVE: 'ACCOUNT_INACTIVE',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  RATE_LIMITED: 'RATE_LIMITED',

  // School errors
  SCHOOL_NOT_FOUND: 'SCHOOL_NOT_FOUND',
  SCHOOL_SUSPENDED: 'SCHOOL_SUSPENDED',

  // Feature errors
  FEATURE_DISABLED: 'FEATURE_DISABLED',
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',

  // Data errors
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONFLICT: 'CONFLICT',

  // Generic
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type EduErrorCode = (typeof EduError)[keyof typeof EduError];

/** Human-readable error messages */
const ERROR_MESSAGES: Record<EduErrorCode, string> = {
  [EduError.UNAUTHENTICATED]: 'You must be logged in to perform this action.',
  [EduError.ACCOUNT_INACTIVE]: 'Your account has been deactivated. Contact your school admin.',
  [EduError.FORBIDDEN]: 'You do not have permission to perform this action.',
  [EduError.INVALID_CREDENTIALS]: 'Invalid email or password.',
  [EduError.RATE_LIMITED]: 'Too many attempts. Please try again later.',
  [EduError.SCHOOL_NOT_FOUND]: 'School not found.',
  [EduError.SCHOOL_SUSPENDED]: "This school's account has been suspended.",
  [EduError.FEATURE_DISABLED]: 'This feature is not enabled for your school.',
  [EduError.SUBSCRIPTION_REQUIRED]: 'This feature requires a higher subscription tier.',
  [EduError.NOT_FOUND]: 'The requested resource was not found.',
  [EduError.ALREADY_EXISTS]: 'A record with this identifier already exists.',
  [EduError.VALIDATION_ERROR]: 'Invalid input data.',
  [EduError.CONFLICT]: 'This action conflicts with existing data.',
  [EduError.INTERNAL_ERROR]: 'An internal error occurred. Please try again.',
};

/**
 * Throw a standardized ConvexError with a typed error code.
 *
 * @param code - The error code
 * @param customMessage - Optional override of the default message
 */
export function throwEduError(code: EduErrorCode, customMessage?: string): never {
  throw new ConvexError(customMessage ?? ERROR_MESSAGES[code]);
}

/**
 * Get the default message for an error code.
 */
export function getErrorMessage(code: EduErrorCode): string {
  return ERROR_MESSAGES[code];
}
