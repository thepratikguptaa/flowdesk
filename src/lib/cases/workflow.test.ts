import { describe, it, expect } from "vitest";

import { canTransition, allowedTransitions, isOpen, availableStatusTargets } from "./workflow";

describe("canTransition", () => {
  it("permits valid lifecycle moves", () => {
    expect(canTransition("SUBMITTED", "UNDER_REVIEW")).toBe(true);
    expect(canTransition("IN_PROGRESS", "RESOLVED")).toBe(true);
    expect(canTransition("RESOLVED", "REOPENED")).toBe(true);
    expect(canTransition("CLOSED", "REOPENED")).toBe(true);
  });
  it("rejects illegal jumps", () => {
    expect(canTransition("SUBMITTED", "RESOLVED")).toBe(false);
    expect(canTransition("CLOSED", "IN_PROGRESS")).toBe(false);
    expect(canTransition("RESOLVED", "SUBMITTED")).toBe(false);
  });
});

describe("isOpen", () => {
  it("classifies open vs terminal statuses", () => {
    expect(isOpen("IN_PROGRESS")).toBe(true);
    expect(isOpen("REOPENED")).toBe(true);
    expect(isOpen("RESOLVED")).toBe(false);
    expect(isOpen("CLOSED")).toBe(false);
  });
});

describe("availableStatusTargets", () => {
  const itCase = {
    status: "IN_PROGRESS" as const,
    reporterId: "c1",
    assigneeId: "s1",
    departmentId: "it",
  };
  const managerIT = { id: "m1", role: "MANAGER" as const, departmentId: "it" };
  const reporter = { id: "c1", role: "CITIZEN" as const, departmentId: null };
  const stranger = { id: "x", role: "CITIZEN" as const, departmentId: null };

  it("gives managers the full set of legal moves", () => {
    expect(availableStatusTargets(managerIT, itCase)).toEqual(allowedTransitions("IN_PROGRESS"));
  });
  it("gives unrelated users nothing", () => {
    expect(availableStatusTargets(stranger, itCase)).toEqual([]);
  });
  it("lets the reporter reopen only a resolved/closed case", () => {
    const resolved = { ...itCase, status: "RESOLVED" as const };
    expect(availableStatusTargets(reporter, resolved)).toEqual(["REOPENED"]);
    expect(availableStatusTargets(reporter, itCase)).toEqual([]);
  });
});
