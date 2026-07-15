import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock the data/infra layers so we can test the authorization orchestration
// in the user server actions without a database or real hashing.
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: vi.fn(), update: vi.fn(), create: vi.fn() },
  },
}));
vi.mock("@/lib/auth/session", () => ({ requireRole: vi.fn() }));
vi.mock("@/lib/audit", () => ({ logAudit: vi.fn(), logFieldChanges: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("bcryptjs", () => ({ default: { hash: vi.fn().mockResolvedValue("hashed") } }));

import {
  createUser,
  updateUser,
  setUserActive,
  resetUserPassword,
} from "./users";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";

const admin = {
  id: "admin1",
  name: "Admin",
  email: "admin@flowdesk.dev",
  role: "ADMIN" as const,
  departmentId: null,
};

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return fd;
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(requireRole).mockResolvedValue(admin);
});

describe("createUser", () => {
  it("requires a department for staff/managers", async () => {
    const res = await createUser(
      {},
      form({ name: "Jane Doe", email: "jane@x.com", role: "STAFF", password: "password123" }),
    );
    expect(res.fieldErrors?.departmentId).toBeTruthy();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});

describe("updateUser", () => {
  it("blocks an admin from demoting their own account (self-lockout guard)", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      id: "admin1",
      role: "ADMIN",
      name: "Admin",
      email: "admin@flowdesk.dev",
      departmentId: null,
    } as never);

    const res = await updateUser(
      {},
      form({ id: "admin1", name: "Admin", email: "admin@flowdesk.dev", role: "MANAGER", departmentId: "it" }),
    );

    expect(res.error).toMatch(/your own role/i);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });
});

describe("setUserActive", () => {
  it("blocks an admin from deactivating themselves", async () => {
    const res = await setUserActive({}, form({ id: "admin1", active: "false" }));
    expect(res.error).toMatch(/your own account/i);
    expect(prisma.user.update).not.toHaveBeenCalled();
  });

  it("bumps tokenVersion when deactivating another user", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ isActive: true } as never);

    const res = await setUserActive({}, form({ id: "u2", active: "false" }));

    expect(res.ok).toBe(true);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u2" },
        data: expect.objectContaining({ isActive: false, tokenVersion: { increment: 1 } }),
      }),
    );
  });
});

describe("resetUserPassword", () => {
  it("re-hashes and bumps tokenVersion to invalidate existing sessions", async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue({ id: "u2" } as never);

    const res = await resetUserPassword({}, form({ id: "u2", password: "newpassword1" }));

    expect(res.ok).toBe(true);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "u2" },
        data: expect.objectContaining({ tokenVersion: { increment: 1 } }),
      }),
    );
  });
});
