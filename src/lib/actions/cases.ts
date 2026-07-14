"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { can, canManageCase, canViewCase } from "@/lib/auth/rbac";
import { logAudit, logFieldChanges } from "@/lib/audit";
import { createCaseSchema, updateCaseSchema } from "@/lib/validation/case";
import type { FormState } from "@/lib/actions/form-state";
import {
  MAX_ATTACHMENT_BYTES,
  isAllowedMime,
  sanitizeFilename,
} from "@/lib/validation/attachment";

const MAX_CASE_IMAGES = 5;

export type CaseActionState = FormState;

export async function createCase(
  _prev: CaseActionState,
  formData: FormData,
): Promise<CaseActionState> {
  const user = await requireUser();
  if (!can(user.role, "case:create")) {
    return { error: "You don’t have permission to create cases." };
  }

  const parsed = createCaseSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    priority: formData.get("priority") ?? "MEDIUM",
    departmentId: formData.get("departmentId"),
    dueDate: formData.get("dueDate") || undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  // Ensure the department exists (avoids opaque FK error).
  const dept = await prisma.department.findUnique({
    where: { id: data.departmentId },
    select: { id: true },
  });
  if (!dept) return { fieldErrors: { departmentId: ["Choose a valid department"] } };

  // Optional images attached at submission time. Validated server-side.
  const files = formData
    .getAll("attachments")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (files.length > MAX_CASE_IMAGES) {
    return { fieldErrors: { attachments: [`You can attach up to ${MAX_CASE_IMAGES} images.`] } };
  }

  const prepared: {
    filename: string;
    mimeType: string;
    size: number;
    bytes: Uint8Array<ArrayBuffer>;
  }[] = [];
  for (const file of files) {
    if (file.size > MAX_ATTACHMENT_BYTES) {
      return { fieldErrors: { attachments: [`"${file.name}" is larger than 10 MB.`] } };
    }
    if (!file.type.startsWith("image/") || !isAllowedMime(file.type)) {
      return { fieldErrors: { attachments: [`"${file.name}" is not a supported image type.`] } };
    }
    prepared.push({
      filename: sanitizeFilename(file.name),
      mimeType: file.type,
      size: file.size,
      bytes: new Uint8Array(await file.arrayBuffer()),
    });
  }

  let newId: string;
  let newNumber: number;
  try {
    const created = await prisma.$transaction(async (tx) => {
      const kase = await tx.case.create({
        data: {
          title: data.title,
          description: data.description,
          category: data.category,
          priority: data.priority,
          departmentId: data.departmentId,
          dueDate: data.dueDate,
          reporterId: user.id,
          status: "SUBMITTED",
          events: {
            create: {
              type: "CREATED",
              actorId: user.id,
              message: `Case created by ${user.name ?? "user"}`,
            },
          },
        },
        select: { id: true, caseNumber: true },
      });

      for (const p of prepared) {
        await tx.attachment.create({
          data: {
            filename: p.filename,
            mimeType: p.mimeType,
            size: p.size,
            caseId: kase.id,
            uploadedById: user.id,
            blob: { create: { data: p.bytes } },
          },
        });
        await tx.caseEvent.create({
          data: {
            caseId: kase.id,
            type: "ATTACHMENT_ADDED",
            actorId: user.id,
            message: `${user.name ?? "User"} attached ${p.filename}`,
          },
        });
      }

      return kase;
    });
    newId = created.id;
    newNumber = created.caseNumber;
    await logAudit({
      userId: user.id,
      action: "case.create",
      entityType: "Case",
      entityId: created.id,
      newValue: data.title,
    });
  } catch {
    return { error: "Could not create the case. Please try again." };
  }

  revalidatePath("/cases");
  redirect(`/cases/${newId}?created=${newNumber}`);
}

export async function updateCase(
  _prev: CaseActionState,
  formData: FormData,
): Promise<CaseActionState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing case id." };

  const existing = await prisma.case.findUnique({ where: { id } });
  if (!existing) return { error: "Case not found." };
  if (!canViewCase(user, existing)) return { error: "Case not found." };

  // Reporters may edit their own case content only while it is still early in
  // the workflow; staff/managers/admins with manage rights may always edit.
  const isReporterEditable =
    existing.reporterId === user.id &&
    (existing.status === "SUBMITTED" || existing.status === "UNDER_REVIEW");
  const canManage = canManageCase(user, existing);
  if (!isReporterEditable && !canManage) {
    return { error: "You don’t have permission to edit this case." };
  }

  const parsed = updateCaseSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    category: formData.get("category"),
    priority: formData.get("priority"),
    departmentId: formData.get("departmentId"),
    dueDate: formData.get("dueDate") || undefined,
  });
  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  // Only users who can manage the case may change priority/department/dueDate.
  const nextPriority = canManage ? data.priority : existing.priority;
  const nextDepartmentId = canManage ? data.departmentId : existing.departmentId;
  const nextDueDate = canManage ? data.dueDate : existing.dueDate;

  try {
    const updated = await prisma.case.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        category: data.category,
        priority: nextPriority,
        departmentId: nextDepartmentId,
        dueDate: nextDueDate,
      },
    });

    await logFieldChanges({
      userId: user.id,
      action: "case.update",
      entityType: "Case",
      entityId: id,
      before: {
        title: existing.title,
        description: existing.description,
        category: existing.category,
        priority: existing.priority,
        departmentId: existing.departmentId,
        dueDate: existing.dueDate,
      },
      after: {
        title: updated.title,
        description: updated.description,
        category: updated.category,
        priority: updated.priority,
        departmentId: updated.departmentId,
        dueDate: updated.dueDate,
      },
    });
  } catch {
    return { error: "Could not update the case. Please try again." };
  }

  revalidatePath(`/cases/${id}`);
  revalidatePath("/cases");
  redirect(`/cases/${id}`);
}
