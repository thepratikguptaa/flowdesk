import type { Prisma } from "@prisma/client";

import type { SessionUser } from "@/lib/auth/session";

/**
 * Prisma `where` filter restricting which cases a user may list/see.
 *  - ADMIN: everything
 *  - MANAGER / STAFF: cases in their department, plus any they reported or are assigned
 *  - CITIZEN: cases they reported or are assigned
 *
 * This is the single source of truth for list scoping and is kept a strict
 * superset of `canViewCase` (rbac.ts): every case a user may open must also be
 * listable, so nothing they can view is missing from their list. The invariant
 * is guarded by a consistency test in scope.test.ts.
 */
export function caseListWhere(user: SessionUser): Prisma.CaseWhereInput {
  if (user.role === "ADMIN") return {};

  const clauses: Prisma.CaseWhereInput[] = [
    { reporterId: user.id },
    { assigneeId: user.id },
  ];
  // Staff and managers additionally see everything in their department.
  if ((user.role === "MANAGER" || user.role === "STAFF") && user.departmentId) {
    clauses.push({ departmentId: user.departmentId });
  }
  return { OR: clauses };
}
