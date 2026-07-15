import { cache } from "react";
import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { atLeast } from "@/lib/auth/rbac";

export type SessionUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
  departmentId: string | null;
};

/**
 * Returns the current user or null. Safe to call in any server context.
 *
 * Beyond decoding the JWT, this re-validates the session against the database:
 * a deactivated account or a bumped `tokenVersion` (from a password reset)
 * invalidates the still-valid-looking token immediately. Wrapped in React
 * `cache` so the extra lookup runs at most once per request.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();
  if (!session?.user) return null;

  const account = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isActive: true, tokenVersion: true },
  });
  if (
    !account ||
    !account.isActive ||
    account.tokenVersion !== session.user.tokenVersion
  ) {
    return null;
  }

  return {
    id: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    role: session.user.role,
    departmentId: session.user.departmentId,
  };
});

/** Require an authenticated user; redirect to /login otherwise. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

/** Require at least the given role; redirect to /dashboard if under-privileged. */
export async function requireRole(min: Role): Promise<SessionUser> {
  const user = await requireUser();
  if (!atLeast(user.role, min)) redirect("/dashboard");
  return user;
}
