import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";

import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { canViewCase, canManageCase, can } from "@/lib/auth/rbac";
import { availableStatusTargets } from "@/lib/cases/workflow";
import { formatCaseNumber } from "@/lib/constants";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PriorityBadge } from "@/components/cases/case-badges";
import { CaseTimeline } from "@/components/cases/case-timeline";
import { AttachmentsPanel } from "@/components/cases/attachments-panel";
import { CaseStatusControl } from "@/components/cases/case-status-control";
import { CaseAssignControl } from "@/components/cases/case-assign-control";
import { CommentSection } from "@/components/cases/comment-section";
import { CaseSummary } from "@/components/cases/case-summary";
import { isAIConfigured } from "@/lib/ai/azure";

export const metadata: Metadata = { title: "Case detail" };

function formatDate(d: Date | null) {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const kase = await prisma.case.findUnique({
    where: { id },
    include: {
      reporter: { select: { name: true, email: true } },
      assignee: { select: { name: true, email: true } },
      department: { select: { name: true } },
      events: {
        orderBy: { createdAt: "desc" },
        include: { actor: { select: { name: true } } },
      },
      attachments: {
        orderBy: { createdAt: "desc" },
        include: { uploadedBy: { select: { name: true } } },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
    },
  });

  if (!kase) notFound();
  if (!canViewCase(user, kase)) notFound();

  const canManage = canManageCase(user, kase);
  const canEdit =
    canManage ||
    (kase.reporterId === user.id &&
      (kase.status === "SUBMITTED" || kase.status === "UNDER_REVIEW"));

  const canAssign =
    can(user.role, "case:assign") &&
    (user.role === "ADMIN" ||
      (user.role === "MANAGER" && user.departmentId === kase.departmentId));

  const members = canAssign
    ? await prisma.user.findMany({
        where: {
          departmentId: kase.departmentId,
          role: { in: ["STAFF", "MANAGER"] },
          isActive: true,
        },
        select: { id: true, name: true },
        orderBy: { name: "asc" },
      })
    : [];

  const statusTargets = availableStatusTargets(user, kase);

  const attachments = kase.attachments.map((a) => ({
    id: a.id,
    filename: a.filename,
    mimeType: a.mimeType,
    size: a.size,
    uploadedByName: a.uploadedBy.name,
    canDelete: a.uploadedById === user.id || canManage,
  }));

  const comments = kase.comments.map((c) => ({
    id: c.id,
    body: c.body,
    authorName: c.author.name,
    createdAt: c.createdAt,
  }));

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title={kase.title}
        description={`${formatCaseNumber(kase.caseNumber)} · ${kase.category}`}
        action={
          canEdit ? (
            <Button variant="outline" render={<Link href={`/cases/${kase.id}/edit`} />}>
              <Pencil className="h-4 w-4" />
              Edit
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <CaseStatusControl caseId={kase.id} status={kase.status} targets={statusTargets} />
        <PriorityBadge priority={kase.priority} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {isAIConfigured() && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  AI summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CaseSummary caseId={kase.id} />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {kase.description}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Comments{comments.length > 0 ? ` (${comments.length})` : ""}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CommentSection caseId={kase.id} comments={comments} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Attachments</CardTitle>
            </CardHeader>
            <CardContent>
              <AttachmentsPanel caseId={kase.id} attachments={attachments} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <CaseTimeline events={kase.events} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Detail label="Department" value={kase.department.name} />
              <Detail
                label="Reporter"
                value={kase.reporter.name ?? kase.reporter.email ?? "—"}
              />

              {canAssign ? (
                <div className="space-y-1.5">
                  <span className="text-muted-foreground">Assignee</span>
                  <CaseAssignControl
                    caseId={kase.id}
                    assigneeId={kase.assigneeId}
                    members={members}
                  />
                </div>
              ) : (
                <Detail label="Assignee" value={kase.assignee?.name ?? "Unassigned"} />
              )}

              <Detail label="Category" value={kase.category} />
              <Detail label="Created" value={formatDate(kase.createdAt)} />
              <Detail label="Due date" value={formatDate(kase.dueDate)} />
              {kase.resolvedAt && (
                <Detail label="Resolved" value={formatDate(kase.resolvedAt)} />
              )}
              {kase.closedAt && <Detail label="Closed" value={formatDate(kase.closedAt)} />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}
