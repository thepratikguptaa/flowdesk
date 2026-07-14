"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { canViewCase } from "@/lib/auth/rbac";
import { notify } from "@/lib/notifications";
import { formatCaseNumber } from "@/lib/constants";

export type CommentState = { ok?: boolean; error?: string };

const bodySchema = z.string().trim().min(1, "Comment can’t be empty").max(2000);

export async function addComment(
  caseId: string,
  rawBody: string,
): Promise<CommentState> {
  const user = await requireUser();

  const parsed = bodySchema.safeParse(rawBody);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const body = parsed.data;

  const kase = await prisma.case.findUnique({ where: { id: caseId } });
  if (!kase || !canViewCase(user, kase)) return { error: "Case not found." };

  await prisma.$transaction([
    prisma.comment.create({ data: { caseId, authorId: user.id, body } }),
    prisma.caseEvent.create({
      data: {
        caseId,
        type: "COMMENT_ADDED",
        actorId: user.id,
        message: `${user.name ?? "User"} commented`,
      },
    }),
  ]);

  // Notify the reporter, the assignee, and the department's managers.
  const managers = await prisma.user.findMany({
    where: { departmentId: kase.departmentId, role: "MANAGER" },
    select: { id: true },
  });
  await notify({
    userIds: [kase.reporterId, kase.assigneeId, ...managers.map((m) => m.id)],
    exclude: user.id,
    caseId,
    type: "COMMENT_ADDED",
    message: `New comment on ${formatCaseNumber(kase.caseNumber)}: ${kase.title}`,
  });

  revalidatePath(`/cases/${caseId}`);
  return { ok: true };
}
