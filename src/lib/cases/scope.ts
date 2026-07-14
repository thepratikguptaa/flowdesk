import type { Prisma } from "@prisma/client";

import type { SessionUser } from "@/lib/auth/session";

/**
 * Prisma `where` filter restricting which cases a user may list/see.
 *  - ADMIN: everything
 *  - MANAGER: cases in their department
 *  - STAFF: cases in their department OR assigned to them
 *  - CITIZEN: only cases they reported
 *
 * This is the single source of truth for list scoping; individual-record
 * access is additionally checked by `canViewCase` (rbac.ts).
 */
export function caseListWhere(user: SessionUser): Prisma.CaseWhereInput {
  switch (user.role) {
    case "ADMIN":
      return {};
    case "MANAGER":
      return user.departmentId
        ? { departmentId: user.departmentId }
        : { id: "__none__" }; // manager with no department sees nothing
    case "STAFF":
      return {
        OR: [
          ...(user.departmentId ? [{ departmentId: user.departmentId }] : []),
          { assigneeId: user.id },
        ],
      };
    case "CITIZEN":
    default:
      return { reporterId: user.id };
  }
}
