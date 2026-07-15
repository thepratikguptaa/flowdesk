"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { Prisma, type Role } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { logAudit, logFieldChanges } from "@/lib/audit";
import { ROLE_NEEDS_DEPARTMENT } from "@/lib/constants";
import { type FormState, isUniqueConstraintError } from "@/lib/actions/form-state";
import {
  createUserSchema,
  updateUserSchema,
  resetPasswordSchema,
} from "@/lib/validation/user";

export type ActionState = FormState;

/** Roles without a department get their departmentId cleared, regardless of form input. */
function departmentForRole(role: Role, departmentId?: string): string | null {
  return ROLE_NEEDS_DEPARTMENT[role] ? (departmentId ?? null) : null;
}

function friendlyWriteError(err: unknown): string {
  if (isUniqueConstraintError(err)) return "An account with that email already exists.";
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
    return "That department no longer exists. Refresh and try again.";
  }
  return "Something went wrong. Please try again.";
}

export async function createUser(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireRole("ADMIN");

  const parsed = createUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    departmentId: formData.get("departmentId"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { name, email, role, password } = parsed.data;
  const departmentId = departmentForRole(role, parsed.data.departmentId);
  const passwordHash = await bcrypt.hash(password, 12);

  let created;
  try {
    created = await prisma.user.create({
      data: { name, email, role, departmentId, passwordHash },
    });
  } catch (err) {
    return { error: friendlyWriteError(err) };
  }

  await logAudit({
    userId: admin.id,
    action: "user.create",
    entityType: "User",
    entityId: created.id,
    newValue: `${created.email} · ${created.role}`,
  });

  revalidatePath("/users");
  return { ok: true };
}

export async function updateUser(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing user id." };

  const parsed = updateUserSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    role: formData.get("role"),
    departmentId: formData.get("departmentId"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return { error: "User not found." };

  const { name, email, role } = parsed.data;
  const departmentId = departmentForRole(role, parsed.data.departmentId);

  // Guard against self-lockout: an admin can't demote their own account and
  // strip the very access they're using to manage everyone else.
  if (id === admin.id && role !== "ADMIN") {
    return { error: "You can't change your own role. Ask another admin to do it." };
  }

  let updated;
  try {
    updated = await prisma.user.update({
      where: { id },
      data: { name, email, role, departmentId },
    });
  } catch (err) {
    return { error: friendlyWriteError(err) };
  }

  await logFieldChanges({
    userId: admin.id,
    action: "user.update",
    entityType: "User",
    entityId: id,
    before: {
      name: existing.name,
      email: existing.email,
      role: existing.role,
      departmentId: existing.departmentId,
    },
    after: {
      name: updated.name,
      email: updated.email,
      role: updated.role,
      departmentId: updated.departmentId,
    },
  });

  revalidatePath("/users");
  return { ok: true };
}

export async function setUserActive(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  const active = formData.get("active") === "true";
  if (!id) return { error: "Missing user id." };

  // An admin deactivating themselves would immediately lock themselves out.
  if (id === admin.id) return { error: "You can't deactivate your own account." };

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) return { error: "User not found." };
  if (existing.isActive === active) return { ok: true }; // no-op

  await prisma.user.update({
    where: { id },
    // Deactivating also bumps tokenVersion so any live session is cut off now,
    // not just blocked at next sign-in.
    data: active ? { isActive: true } : { isActive: false, tokenVersion: { increment: 1 } },
  });
  await logAudit({
    userId: admin.id,
    action: active ? "user.reactivate" : "user.deactivate",
    entityType: "User",
    entityId: id,
    field: "isActive",
    oldValue: String(existing.isActive),
    newValue: String(active),
  });

  revalidatePath("/users");
  return { ok: true };
}

export async function resetUserPassword(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing user id." };

  const parsed = resetPasswordSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!existing) return { error: "User not found." };

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  // Bump tokenVersion so any existing JWT sessions for this user are invalidated.
  await prisma.user.update({
    where: { id },
    data: { passwordHash, tokenVersion: { increment: 1 } },
  });

  // Never record the password value itself in the audit trail.
  await logAudit({
    userId: admin.id,
    action: "user.resetPassword",
    entityType: "User",
    entityId: id,
  });

  revalidatePath("/users");
  return { ok: true };
}
