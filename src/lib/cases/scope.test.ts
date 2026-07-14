import { describe, it, expect } from "vitest";

import { caseListWhere } from "./scope";
import type { SessionUser } from "@/lib/auth/session";

function user(role: SessionUser["role"], departmentId: string | null, id = "u1"): SessionUser {
  return { id, role, departmentId, name: null, email: null };
}

describe("caseListWhere", () => {
  it("admins see everything (empty filter)", () => {
    expect(caseListWhere(user("ADMIN", null))).toEqual({});
  });

  it("citizens see only cases they reported", () => {
    expect(caseListWhere(user("CITIZEN", null, "c1"))).toEqual({ reporterId: "c1" });
  });

  it("managers see their department", () => {
    expect(caseListWhere(user("MANAGER", "it"))).toEqual({ departmentId: "it" });
  });

  it("managers with no department see nothing", () => {
    expect(caseListWhere(user("MANAGER", null))).toEqual({ id: "__none__" });
  });

  it("staff see their department OR cases assigned to them", () => {
    const where = caseListWhere(user("STAFF", "it", "s1"));
    expect(where).toEqual({ OR: [{ departmentId: "it" }, { assigneeId: "s1" }] });
  });
});
