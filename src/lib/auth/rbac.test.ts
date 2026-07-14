import { describe, it, expect } from "vitest";

import { can, canViewCase, canManageCase, atLeast } from "./rbac";

const citizen = { id: "c1", role: "CITIZEN" as const, departmentId: null };
const staffIT = { id: "s1", role: "STAFF" as const, departmentId: "it" };
const managerIT = { id: "m1", role: "MANAGER" as const, departmentId: "it" };
const admin = { id: "a1", role: "ADMIN" as const, departmentId: null };

const itCase = { reporterId: "c1", assigneeId: "s1", departmentId: "it" };
const hrCase = { reporterId: "c9", assigneeId: null, departmentId: "hr" };

describe("atLeast", () => {
  it("respects the role hierarchy", () => {
    expect(atLeast("ADMIN", "MANAGER")).toBe(true);
    expect(atLeast("STAFF", "MANAGER")).toBe(false);
    expect(atLeast("MANAGER", "MANAGER")).toBe(true);
  });
});

describe("can", () => {
  it("gates capabilities by role", () => {
    expect(can("ADMIN", "user:manage")).toBe(true);
    expect(can("MANAGER", "user:manage")).toBe(false);
    expect(can("MANAGER", "case:assign")).toBe(true);
    expect(can("STAFF", "case:assign")).toBe(false);
    expect(can("CITIZEN", "case:create")).toBe(true);
    expect(can("CITIZEN", "analytics:view")).toBe(false);
  });
});

describe("canViewCase", () => {
  it("lets admins see everything", () => {
    expect(canViewCase(admin, hrCase)).toBe(true);
  });
  it("lets the reporter and assignee see their case", () => {
    expect(canViewCase(citizen, itCase)).toBe(true); // reporter
    expect(canViewCase(staffIT, itCase)).toBe(true); // assignee
  });
  it("lets department staff/managers see department cases", () => {
    expect(canViewCase(managerIT, itCase)).toBe(true);
  });
  it("blocks unrelated users", () => {
    expect(canViewCase(citizen, hrCase)).toBe(false);
    expect(canViewCase(managerIT, hrCase)).toBe(false);
  });
});

describe("canManageCase", () => {
  it("allows admin and department manager", () => {
    expect(canManageCase(admin, hrCase)).toBe(true);
    expect(canManageCase(managerIT, itCase)).toBe(true);
  });
  it("allows the assigned staff only", () => {
    expect(canManageCase(staffIT, itCase)).toBe(true);
    expect(canManageCase({ ...staffIT, id: "other" }, itCase)).toBe(false);
  });
  it("never lets a plain citizen manage", () => {
    expect(canManageCase(citizen, itCase)).toBe(false);
  });
});
