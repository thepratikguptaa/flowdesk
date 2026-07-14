import type { Role } from "@prisma/client";

/**
 * Role-based access control for FlowDesk.
 *
 * Roles form a loose hierarchy for privilege level, but most authorization is
 * capability-based (see `can`) plus ownership/department scoping enforced at
 * the data layer. Keeping these as pure functions makes them trivial to unit
 * test and reuse across server actions, route handlers, and UI guards.
 */

export const ROLE_RANK: Record<Role, number> = {
  CITIZEN: 0,
  STAFF: 1,
  MANAGER: 2,
  ADMIN: 3,
};

export function atLeast(role: Role, min: Role): boolean {
  return ROLE_RANK[role] >= ROLE_RANK[min];
}

/** Capabilities that are decided purely by role, independent of a specific record. */
export type Capability =
  | "case:create"
  | "case:viewAll" // see cases beyond own/department
  | "case:assign" // set/change assignee
  | "case:changePriority"
  | "case:escalate"
  | "case:changeStatusAny" // move status without being reporter/assignee
  | "department:manage"
  | "user:manage"
  | "analytics:view"
  | "audit:view";

const CAPABILITIES: Record<Capability, Role[]> = {
  "case:create": ["CITIZEN", "STAFF", "MANAGER", "ADMIN"],
  "case:viewAll": ["ADMIN"],
  "case:assign": ["MANAGER", "ADMIN"],
  "case:changePriority": ["MANAGER", "ADMIN"],
  "case:escalate": ["MANAGER", "ADMIN"],
  "case:changeStatusAny": ["STAFF", "MANAGER", "ADMIN"],
  "department:manage": ["ADMIN"],
  "user:manage": ["ADMIN"],
  "analytics:view": ["MANAGER", "ADMIN"],
  "audit:view": ["ADMIN"],
};

export function can(role: Role, capability: Capability): boolean {
  return CAPABILITIES[capability].includes(role);
}

/**
 * Record-scoped visibility. A user can view a case if they:
 *  - are an ADMIN (all cases), or
 *  - reported it, or are the assignee, or
 *  - are STAFF/MANAGER in the owning department.
 */
export function canViewCase(
  user: { id: string; role: Role; departmentId: string | null },
  kase: { reporterId: string; assigneeId: string | null; departmentId: string },
): boolean {
  if (user.role === "ADMIN") return true;
  if (kase.reporterId === user.id) return true;
  if (kase.assigneeId === user.id) return true;
  if (
    (user.role === "MANAGER" || user.role === "STAFF") &&
    user.departmentId === kase.departmentId
  ) {
    return true;
  }
  return false;
}

/** Whether a user may change workflow/fields on a case (not just comment). */
export function canManageCase(
  user: { id: string; role: Role; departmentId: string | null },
  kase: { assigneeId: string | null; departmentId: string },
): boolean {
  if (user.role === "ADMIN") return true;
  if (user.role === "MANAGER" && user.departmentId === kase.departmentId) return true;
  if (user.role === "STAFF" && kase.assigneeId === user.id) return true;
  return false;
}
