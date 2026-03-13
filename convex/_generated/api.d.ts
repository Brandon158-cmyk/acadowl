/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as PasswordReset from "../PasswordReset.js";
import type * as _lib_errors from "../_lib/errors.js";
import type * as _lib_featureGuard from "../_lib/featureGuard.js";
import type * as _lib_isSchoolDay from "../_lib/isSchoolDay.js";
import type * as _lib_permissions from "../_lib/permissions.js";
import type * as _lib_schoolContext from "../_lib/schoolContext.js";
import type * as academics_grades from "../academics/grades.js";
import type * as academics_homework from "../academics/homework.js";
import type * as academics_homeworkSubmissions from "../academics/homeworkSubmissions.js";
import type * as academics_lessonPlans from "../academics/lessonPlans.js";
import type * as academics_sections from "../academics/sections.js";
import type * as academics_subjects from "../academics/subjects.js";
import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as debugAuth from "../debugAuth.js";
import type * as http from "../http.js";
import type * as migrations_backfillHomeworkSchoolId from "../migrations/backfillHomeworkSchoolId.js";
import type * as notifications_queries from "../notifications/queries.js";
import type * as platformAdmin from "../platformAdmin.js";
import type * as schools_academicYears from "../schools/academicYears.js";
import type * as schools_mutations from "../schools/mutations.js";
import type * as schools_queries from "../schools/queries.js";
import type * as schools_schoolEvents from "../schools/schoolEvents.js";
import type * as schools_terms from "../schools/terms.js";
import type * as schools_validation from "../schools/validation.js";
import type * as seed from "../seed.js";
import type * as users_mutations from "../users/mutations.js";
import type * as users_queries from "../users/queries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  PasswordReset: typeof PasswordReset;
  "_lib/errors": typeof _lib_errors;
  "_lib/featureGuard": typeof _lib_featureGuard;
  "_lib/isSchoolDay": typeof _lib_isSchoolDay;
  "_lib/permissions": typeof _lib_permissions;
  "_lib/schoolContext": typeof _lib_schoolContext;
  "academics/grades": typeof academics_grades;
  "academics/homework": typeof academics_homework;
  "academics/homeworkSubmissions": typeof academics_homeworkSubmissions;
  "academics/lessonPlans": typeof academics_lessonPlans;
  "academics/sections": typeof academics_sections;
  "academics/subjects": typeof academics_subjects;
  auth: typeof auth;
  crons: typeof crons;
  debugAuth: typeof debugAuth;
  http: typeof http;
  "migrations/backfillHomeworkSchoolId": typeof migrations_backfillHomeworkSchoolId;
  "notifications/queries": typeof notifications_queries;
  platformAdmin: typeof platformAdmin;
  "schools/academicYears": typeof schools_academicYears;
  "schools/mutations": typeof schools_mutations;
  "schools/queries": typeof schools_queries;
  "schools/schoolEvents": typeof schools_schoolEvents;
  "schools/terms": typeof schools_terms;
  "schools/validation": typeof schools_validation;
  seed: typeof seed;
  "users/mutations": typeof users_mutations;
  "users/queries": typeof users_queries;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
