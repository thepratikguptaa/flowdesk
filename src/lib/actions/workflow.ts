"use server";

import { revalidatePath } from "next/cache";
import type { CaseStatus, Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth/session";
import { can, canManageCase, canViewCase } from "@/lib/auth/rbac";
import { canTransition, eventTypeForTransition } from "@/lib/cases/workflow";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { formatCaseNumber, STATUS_META } from "@/lib/constants";

export type WorkflowState = { ok?: boolean; error?: string };

export async function changeCaseStatus(
  caseId: string,
  to: CaseStatus,
): Promise<WorkflowState> {
  const user = await requireUser();

  const kase = await prisma.case.findUnique({ where: { id: caseId } });
  if (!kase || !canViewCase(user, kase)) return { error: "Case not found." };

  // Reporters may reopen their own resolved/closed case; otherwise the actor
  // must be able to manage the case (assigned staff, dept manager, or admin).
  const isReopen = to === "REOPENED";
  const reporterCanReopen =
    isReopen &&
    kase.reporterId === user.id &&
    (kase.status === "RESOLVED" || kase.status === "CLOSED");
  if (!canManageCase(user, kase) && !reporterCanReopen) {
    return { error: "You don’t have permission to change this case’s status." };
  }

  if (kase.status === to) return { ok: true };
  if (!canTransition(kase.status, to)) {
    return {
      error: `Can’t move a case from ${STATUS_META[kase.status].label} to ${STATUS_META[to].label}.`,
    };
  }

  const data: Prisma.CaseUpdateInput = { status: to };
  if (to === "RESOLVED") data.resolvedAt = new Date();
  if (to === "CLOSED") data.closedAt = new Date();
  if (to === "REOPENED") {
    data.resolvedAt = null;
    data.closedAt = null;
  }

  const ref = formatCaseNumber(kase.caseNumber);
  const message = `${ref} moved to ${STATUS_META[to].label}`;

  await prisma.$transaction([
    prisma.case.update({ where: { id: caseId }, data }),
    prisma.caseEvent.create({
      data: {
        caseId,
        type: eventTypeForTransition(to),
        actorId: user.id,
        message: `${user.name ?? "User"} changed status to ${STATUS_META[to].label}`,
      },
    }),
  ]);

  await notify({
    userIds: [kase.reporterId, kase.assigneeId],
    exclude: user.id,
    caseId,
    type: to === "RESOLVED" ? "RESOLVED" : to === "REOPENED" ? "REOPENED" : "STATUS_CHANGED",
    message,
  });

  await logAudit({
    userId: user.id,
    action: "case.status",
    entityType: "Case",
    entityId: caseId,
    field: "status",
    oldValue: kase.status,
    newValue: to,
  });

  revalidatePath(`/cases/${caseId}`);
  revalidatePath("/cases");
  return { ok: true };
}

export async function assignCase(
  caseId: string,
  assigneeId: string | null,
): Promise<WorkflowState> {
  const user = await requireUser();
  if (!can(user.role, "case:assign")) {
    return { error: "You don’t have permission to assign cases." };
  }

  const kase = await prisma.case.findUnique({ where: { id: caseId } });
  if (!kase || !canViewCase(user, kase)) return { error: "Case not found." };

  // Managers may only assign within their own department; admins anywhere.
  if (user.role === "MANAGER" && user.departmentId !== kase.departmentId) {
    return { error: "You can only assign cases in your department." };
  }

  let assigneeName = "Unassigned";
  if (assigneeId) {
    const assignee = await prisma.user.findUnique({ where: { id: assigneeId } });
    if (!assignee || !assignee.isActive) return { error: "Invalid assignee." };
    if (
      assignee.departmentId !== kase.departmentId ||
      !(assignee.role === "STAFF" || assignee.role === "MANAGER")
    ) {
      return { error: "Assignee must be staff or a manager in this department." };
    }
    assigneeName = assignee.name;
  }

  const data: Prisma.CaseUpdateInput = {
    assignee: assigneeId ? { connect: { id: assigneeId } } : { disconnect: true },
  };
  // First assignment nudges the workflow forward.
  if (assigneeId && (kase.status === "SUBMITTED" || kase.status === "UNDER_REVIEW")) {
    data.status = "ASSIGNED";
  }

  const ref = formatCaseNumber(kase.caseNumber);

  await prisma.$transaction([
    prisma.case.update({ where: { id: caseId }, data }),
    prisma.caseEvent.create({
      data: {
        caseId,
        type: "ASSIGNED",
        actorId: user.id,
        message: assigneeId
          ? `${user.name ?? "User"} assigned the case to ${assigneeName}`
          : `${user.name ?? "User"} unassigned the case`,
      },
    }),
  ]);

  if (assigneeId) {
    await notify({
      userIds: [assigneeId],
      exclude: user.id,
      caseId,
      type: "ASSIGNED",
      message: `You were assigned ${ref}: ${kase.title}`,
    });
  }

  await logAudit({
    userId: user.id,
    action: "case.assign",
    entityType: "Case",
    entityId: caseId,
    field: "assigneeId",
    oldValue: kase.assigneeId,
    newValue: assigneeId,
  });

  revalidatePath(`/cases/${caseId}`);
  revalidatePath("/cases");
  return { ok: true };
}
