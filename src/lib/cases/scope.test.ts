import { describe, it, expect } from "vitest";
import type { Prisma, Role } from "@prisma/client";

import { caseListWhere } from "./scope";
import { canViewCase } from "@/lib/auth/rbac";
import type { SessionUser } from "@/lib/auth/session";

function user(role: Role, departmentId: string | null, id = "u1"): SessionUser {
  return { id, role, departmentId, name: null, email: null };
}

describe("caseListWhere (shapes)", () => {
  it("admins see everything (empty filter)", () => {
    expect(caseListWhere(user("ADMIN", null))).toEqual({});
  });

  it("citizens see cases they reported or are assigned", () => {
    expect(caseListWhere(user("CITIZEN", null, "c1"))).toEqual({
      OR: [{ reporterId: "c1" }, { assigneeId: "c1" }],
    });
  });

  it("managers see their department plus their own reported/assigned", () => {
    expect(caseListWhere(user("MANAGER", "it", "m1"))).toEqual({
      OR: [{ reporterId: "m1" }, { assigneeId: "m1" }, { departmentId: "it" }],
    });
  });

  it("staff see their department plus their own reported/assigned", () => {
    expect(caseListWhere(user("STAFF", "it", "s1"))).toEqual({
      OR: [{ reporterId: "s1" }, { assigneeId: "s1" }, { departmentId: "it" }],
    });
  });

  it("a manager with no department still sees their own reported/assigned", () => {
    expect(caseListWhere(user("MANAGER", null, "m1"))).toEqual({
      OR: [{ reporterId: "m1" }, { assigneeId: "m1" }],
    });
  });
});

// Evaluate the (small, known) set of `where` shapes caseListWhere produces
// against an in-memory case, so we can compare list scope with canViewCase.
type CaseRow = {
  id: string;
  reporterId: string;
  assigneeId: string | null;
  departmentId: string;
};

function matchesClause(clause: Prisma.CaseWhereInput, c: CaseRow): boolean {
  return Object.entries(clause).every(
    ([key, value]) => c[key as keyof CaseRow] === value,
  );
}

function matchesWhere(where: Prisma.CaseWhereInput, c: CaseRow): boolean {
  if (Object.keys(where).length === 0) return true; // admin: {}
  if (Array.isArray(where.OR)) {
    return where.OR.some((clause) => matchesClause(clause as Prisma.CaseWhereInput, c));
  }
  return matchesClause(where, c);
}

describe("caseListWhere ⇔ canViewCase consistency", () => {
  const users: SessionUser[] = [
    user("ADMIN", null, "admin"),
    user("MANAGER", "it", "mgr-it"),
    user("MANAGER", null, "mgr-none"),
    user("STAFF", "it", "staff-it"),
    user("STAFF", "hr", "staff-hr"),
    user("CITIZEN", null, "cit"),
  ];

  const cases: CaseRow[] = [
    { id: "k1", reporterId: "cit", assigneeId: "staff-it", departmentId: "it" },
    { id: "k2", reporterId: "someone", assigneeId: null, departmentId: "it" },
    { id: "k3", reporterId: "someone", assigneeId: null, departmentId: "hr" },
    // reported by a manager, but for another department:
    { id: "k4", reporterId: "mgr-none", assigneeId: null, departmentId: "hr" },
    // assigned to a staff member outside their own department:
    { id: "k5", reporterId: "someone", assigneeId: "staff-hr", departmentId: "it" },
  ];

  it("lists exactly the cases a user is allowed to view", () => {
    for (const u of users) {
      const where = caseListWhere(u);
      for (const c of cases) {
        expect(matchesWhere(where, c)).toBe(canViewCase(u, c));
      }
    }
  });
});
