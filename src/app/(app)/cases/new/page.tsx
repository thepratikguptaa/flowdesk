import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { CaseForm } from "@/components/cases/case-form";

export const metadata: Metadata = { title: "New case" };

export default async function NewCasePage() {
  const user = await requireUser();

  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });

  // Prefill the reporter's own department when they have one.
  const values = user.departmentId ? { departmentId: user.departmentId } : {};

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader
        title="Submit a new case"
        description="Describe your request or issue and route it to the right department."
      />
      <Card>
        <CardContent className="pt-6">
          <CaseForm mode="create" departments={departments} values={values} />
        </CardContent>
      </Card>
    </div>
  );
}
