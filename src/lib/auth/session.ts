import { redirect } from "next/navigation";
import type { Role } from "@prisma/client";

import { auth } from "@/auth";
import { atLeast } from "@/lib/auth/rbac";

export type SessionUser = {
  id: string;
  name: string | null;
  email: string | null;
  role: Role;
  departmentId: string | null;
};

/** Returns the current user or null. Safe to call in any server context. */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await auth();
  if (!session?.user) return null;
  return {
    id: session.user.id,
    name: session.user.name ?? null,
    email: session.user.email ?? null,
    role: session.user.role,
    departmentId: session.user.departmentId,
  };
}

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
