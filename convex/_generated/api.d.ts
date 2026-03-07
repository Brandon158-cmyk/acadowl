/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as _lib_errors from "../_lib/errors.js";
import type * as _lib_featureGuard from "../_lib/featureGuard.js";
import type * as _lib_permissions from "../_lib/permissions.js";
import type * as _lib_schoolContext from "../_lib/schoolContext.js";
import type * as auth from "../auth.js";
import type * as crons from "../crons.js";
import type * as debugAuth from "../debugAuth.js";
import type * as http from "../http.js";
import type * as notifications_queries from "../notifications/queries.js";
import type * as platformAdmin from "../platformAdmin.js";
import type * as schools_mutations from "../schools/mutations.js";
import type * as schools_queries from "../schools/queries.js";
import type * as seed from "../seed.js";
import type * as users_mutations from "../users/mutations.js";
import type * as users_queries from "../users/queries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "_lib/errors": typeof _lib_errors;
  "_lib/featureGuard": typeof _lib_featureGuard;
  "_lib/permissions": typeof _lib_permissions;
  "_lib/schoolContext": typeof _lib_schoolContext;
  auth: typeof auth;
  crons: typeof crons;
  debugAuth: typeof debugAuth;
  http: typeof http;
  "notifications/queries": typeof notifications_queries;
  platformAdmin: typeof platformAdmin;
  "schools/mutations": typeof schools_mutations;
  "schools/queries": typeof schools_queries;
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
