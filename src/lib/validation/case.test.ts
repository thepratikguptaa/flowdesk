import { describe, it, expect } from "vitest";

import { createCaseSchema } from "./case";

const base = {
  title: "Printer not working on floor 3",
  description: "The shared printer is offline and won't respond.",
  category: "Technical Support" as const,
  priority: "MEDIUM" as const,
  departmentId: "dept1",
};

const today = new Date().toISOString().slice(0, 10);

describe("createCaseSchema", () => {
  it("accepts a valid case", () => {
    expect(createCaseSchema.safeParse(base).success).toBe(true);
  });

  it("rejects a short title", () => {
    expect(createCaseSchema.safeParse({ ...base, title: "hi" }).success).toBe(false);
  });

  it("rejects an unknown category", () => {
    expect(createCaseSchema.safeParse({ ...base, category: "Nonsense" }).success).toBe(false);
  });

  it("rejects a past due date", () => {
    const r = createCaseSchema.safeParse({ ...base, dueDate: "2000-01-01" });
    expect(r.success).toBe(false);
  });

  it("accepts today's due date and defaults priority", () => {
    const r = createCaseSchema.safeParse({ ...base, dueDate: today, priority: undefined });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.priority).toBe("MEDIUM");
  });
});
