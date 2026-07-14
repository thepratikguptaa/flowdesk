import type { CaseStatus, CaseEventType, Role } from "@prisma/client";

import { canManageCase } from "@/lib/auth/rbac";

/**
 * Case workflow state machine.
 *
 * Defines which status transitions are legal. Actor permissions are enforced
 * separately (see rbac.ts / the changeCaseStatus action); this map only encodes
 * the lifecycle shape so illegal jumps (e.g. SUBMITTED → RESOLVED) are rejected.
 */
export const TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  SUBMITTED: ["UNDER_REVIEW", "ASSIGNED", "CLOSED"],
  UNDER_REVIEW: ["ASSIGNED", "IN_PROGRESS", "WAITING", "CLOSED"],
  ASSIGNED: ["IN_PROGRESS", "WAITING", "CLOSED"],
  IN_PROGRESS: ["WAITING", "RESOLVED", "CLOSED"],
  WAITING: ["IN_PROGRESS", "RESOLVED", "CLOSED"],
  RESOLVED: ["CLOSED", "REOPENED"],
  CLOSED: ["REOPENED"],
  REOPENED: ["ASSIGNED", "IN_PROGRESS", "WAITING", "CLOSED"],
};

export function allowedTransitions(from: CaseStatus): CaseStatus[] {
  return TRANSITIONS[from] ?? [];
}

export function canTransition(from: CaseStatus, to: CaseStatus): boolean {
  return allowedTransitions(from).includes(to);
}

/** The timeline event type that best represents a given transition. */
export function eventTypeForTransition(to: CaseStatus): CaseEventType {
  if (to === "CLOSED") return "CLOSED";
  if (to === "REOPENED") return "REOPENED";
  return "STATUS_CHANGED";
}

/** Statuses that count as "open" (actively being worked or awaiting action). */
export const OPEN_STATUSES: CaseStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "ASSIGNED",
  "IN_PROGRESS",
  "WAITING",
  "REOPENED",
];

export function isOpen(status: CaseStatus): boolean {
  return OPEN_STATUSES.includes(status);
}

/**
 * Status transitions a specific user is allowed to perform on a case — the
 * intersection of the state machine and the user's permissions. Reporters can
 * only reopen their own resolved/closed cases.
 */
export function availableStatusTargets(
  user: { id: string; role: Role; departmentId: string | null },
  kase: {
    status: CaseStatus;
    reporterId: string;
    assigneeId: string | null;
    departmentId: string;
  },
): CaseStatus[] {
  const canManage = canManageCase(user, kase);
  return allowedTransitions(kase.status).filter((to) => {
    if (canManage) return true;
    return (
      to === "REOPENED" &&
      kase.reporterId === user.id &&
      (kase.status === "RESOLVED" || kase.status === "CLOSED")
    );
  });
}
