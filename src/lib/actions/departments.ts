"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/session";
import { logAudit, logFieldChanges } from "@/lib/audit";
import { type FormState, isUniqueConstraintError } from "@/lib/actions/form-state";
import { departmentSchema } from "@/lib/validation/department";

export type ActionState = FormState;

export async function createDepartment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireRole("ADMIN");

  const parsed = departmentSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  try {
    const dept = await prisma.department.create({ data: parsed.data });
    await logAudit({
      userId: admin.id,
      action: "department.create",
      entityType: "Department",
      entityId: dept.id,
      newValue: dept.name,
    });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return { error: "A department with that name already exists." };
    }
    return { error: "Could not create department. Please try again." };
  }

  revalidatePath("/departments");
  return { ok: true };
}

export async function updateDepartment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing department id." };

  const parsed = departmentSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const existing = await prisma.department.findUnique({ where: { id } });
  if (!existing) return { error: "Department not found." };

  try {
    const updated = await prisma.department.update({
      where: { id },
      data: parsed.data,
    });
    await logFieldChanges({
      userId: admin.id,
      action: "department.update",
      entityType: "Department",
      entityId: id,
      before: { name: existing.name, description: existing.description },
      after: { name: updated.name, description: updated.description ?? null },
    });
  } catch (err) {
    if (isUniqueConstraintError(err)) {
      return { error: "A department with that name already exists." };
    }
    return { error: "Could not update department. Please try again." };
  }

  revalidatePath("/departments");
  return { ok: true };
}

export async function deleteDepartment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const admin = await requireRole("ADMIN");
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing department id." };

  const dept = await prisma.department.findUnique({
    where: { id },
    include: { _count: { select: { cases: true, users: true } } },
  });
  if (!dept) return { error: "Department not found." };

  if (dept._count.cases > 0) {
    return {
      error: `Cannot delete "${dept.name}" — it still has ${dept._count.cases} case(s). Reassign or close them first.`,
    };
  }

  try {
    // Users in this department have departmentId set to NULL (schema onDelete).
    await prisma.department.delete({ where: { id } });
    await logAudit({
      userId: admin.id,
      action: "department.delete",
      entityType: "Department",
      entityId: id,
      oldValue: dept.name,
    });
  } catch {
    return { error: "Could not delete department. Please try again." };
  }

  revalidatePath("/departments");
  return { ok: true };
}
