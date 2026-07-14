"use server";

import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { canViewCase } from "@/lib/auth/rbac";
import { logAudit } from "@/lib/audit";
import {
  MAX_ATTACHMENT_BYTES,
  isAllowedMime,
  sanitizeFilename,
  ALLOWED_MIME_TYPES,
} from "@/lib/validation/attachment";

export type UploadState = { ok?: boolean; error?: string };

export async function uploadAttachment(
  _prev: UploadState,
  formData: FormData,
): Promise<UploadState> {
  const user = await requireUser();
  const caseId = String(formData.get("caseId") ?? "");
  const file = formData.get("file");

  if (!caseId) return { error: "Missing case." };
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a file to upload." };
  }

  // Only people who can see the case may attach to it.
  const kase = await prisma.case.findUnique({ where: { id: caseId } });
  if (!kase || !canViewCase(user, kase)) return { error: "Case not found." };

  if (file.size > MAX_ATTACHMENT_BYTES) {
    return { error: "File is too large (max 10 MB)." };
  }
  if (!isAllowedMime(file.type)) {
    return {
      error: `Unsupported file type. Allowed: ${Object.values(ALLOWED_MIME_TYPES)
        .filter((v, i, a) => a.indexOf(v) === i)
        .join(", ")}.`,
    };
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const filename = sanitizeFilename(file.name);

  try {
    await prisma.$transaction([
      prisma.attachment.create({
        data: {
          filename,
          mimeType: file.type,
          size: file.size,
          caseId,
          uploadedById: user.id,
          blob: { create: { data: bytes } },
        },
      }),
      prisma.caseEvent.create({
        data: {
          caseId,
          type: "ATTACHMENT_ADDED",
          actorId: user.id,
          message: `${user.name ?? "User"} attached ${filename}`,
        },
      }),
    ]);

    await logAudit({
      userId: user.id,
      action: "attachment.create",
      entityType: "Case",
      entityId: caseId,
      newValue: filename,
    });
  } catch {
    return { error: "Upload failed. Please try again." };
  }

  revalidatePath(`/cases/${caseId}`);
  return { ok: true };
}

export async function deleteAttachment(
  _prev: UploadState,
  formData: FormData,
): Promise<UploadState> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  if (!id) return { error: "Missing attachment." };

  const attachment = await prisma.attachment.findUnique({
    where: { id },
    include: { case: true },
  });
  if (!attachment || !canViewCase(user, attachment.case)) {
    return { error: "Attachment not found." };
  }

  // Uploader can remove their own file; managers/admins can remove any.
  const isUploader = attachment.uploadedById === user.id;
  const isManagerOrAdmin =
    user.role === "ADMIN" ||
    (user.role === "MANAGER" && user.departmentId === attachment.case.departmentId);
  if (!isUploader && !isManagerOrAdmin) {
    return { error: "You can’t remove this attachment." };
  }

  await prisma.attachment.delete({ where: { id } });
  await logAudit({
    userId: user.id,
    action: "attachment.delete",
    entityType: "Case",
    entityId: attachment.caseId,
    oldValue: attachment.filename,
  });

  revalidatePath(`/cases/${attachment.caseId}`);
  return { ok: true };
}
