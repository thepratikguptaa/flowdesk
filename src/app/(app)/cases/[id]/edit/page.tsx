import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { canViewCase, canManageCase } from "@/lib/auth/rbac";
import { formatCaseNumber } from "@/lib/constants";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { CaseForm } from "@/components/cases/case-form";

export const metadata: Metadata = { title: "Edit case" };

function toDateInput(d: Date | null) {
  return d ? d.toISOString().slice(0, 10) : undefined;
}

export default async function EditCasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const kase = await prisma.case.findUnique({ where: { id } });
  if (!kase || !canViewCase(user, kase)) notFound();

  const canManage = canManageCase(user, kase);
  const isReporterEditable =
    kase.reporterId === user.id &&
    (kase.status === "SUBMITTED" || kase.status === "UNDER_REVIEW");
  if (!canManage && !isReporterEditable) notFound();

  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Edit case"
        description={`${formatCaseNumber(kase.caseNumber)} · ${kase.title}`}
      />
      <Card>
        <CardContent className="pt-6">
          <CaseForm
            mode="edit"
            departments={departments}
            canManageFields={canManage}
            values={{
              id: kase.id,
              title: kase.title,
              description: kase.description,
              category: kase.category,
              priority: kase.priority,
              departmentId: kase.departmentId,
              dueDate: toDateInput(kase.dueDate),
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
