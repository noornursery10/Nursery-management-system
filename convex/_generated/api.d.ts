/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as attendance from "../attendance.js";
import type * as auth from "../auth.js";
import type * as children from "../children.js";
import type * as expenses from "../expenses.js";
import type * as fees from "../fees.js";
import type * as http from "../http.js";
import type * as parents from "../parents.js";
import type * as payments from "../payments.js";
import type * as receipts from "../receipts.js";
import type * as router from "../router.js";
import type * as settings from "../settings.js";
import type * as staff from "../staff.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  attendance: typeof attendance;
  auth: typeof auth;
  children: typeof children;
  expenses: typeof expenses;
  fees: typeof fees;
  http: typeof http;
  parents: typeof parents;
  payments: typeof payments;
  receipts: typeof receipts;
  router: typeof router;
  settings: typeof settings;
  staff: typeof staff;
  users: typeof users;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {};
