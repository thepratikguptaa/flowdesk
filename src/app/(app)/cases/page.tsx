import type { Metadata } from "next";
import Link from "next/link";
import { Prisma, type CaseStatus, type Priority } from "@prisma/client";
import { Inbox, PlusCircle } from "lucide-react";

import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { caseListWhere } from "@/lib/cases/scope";
import { formatCaseNumber, STATUSES, PRIORITIES } from "@/lib/constants";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge, PriorityBadge } from "@/components/cases/case-badges";
import { CaseFilters } from "@/components/cases/case-filters";

export const metadata: Metadata = { title: "Cases" };

type SP = { q?: string; status?: string; priority?: string };

export default async function CasesPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const user = await requireUser();
  const sp = await searchParams;

  const filters: Prisma.CaseWhereInput[] = [caseListWhere(user)];

  if (sp.status && STATUSES.includes(sp.status as CaseStatus)) {
    filters.push({ status: sp.status as CaseStatus });
  }
  if (sp.priority && PRIORITIES.includes(sp.priority as Priority)) {
    filters.push({ priority: sp.priority as Priority });
  }
  if (sp.q?.trim()) {
    const q = sp.q.trim();
    const digits = q.replace(/\D/g, "");
    filters.push({
      OR: [
        { title: { contains: q, mode: "insensitive" } },
        ...(digits ? [{ caseNumber: Number(digits) }] : []),
      ],
    });
  }

  const cases = await prisma.case.findMany({
    where: { AND: filters },
    orderBy: [{ createdAt: "desc" }],
    take: 100,
    include: {
      department: { select: { name: true } },
      assignee: { select: { name: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Cases"
        description={
          user.role === "CITIZEN"
            ? "Cases you have submitted."
            : "Cases visible to you based on your role and department."
        }
        action={
          <Button render={<Link href="/cases/new" />}>
            <PlusCircle className="h-4 w-4" />
            New case
          </Button>
        }
      />

      <CaseFilters />

      {cases.length === 0 ? (
        <div className="mt-4 flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Inbox className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">No cases found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try adjusting your filters, or submit a new case.
          </p>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-28">Case</TableHead>
                <TableHead>Title</TableHead>
                <TableHead className="hidden md:table-cell">Department</TableHead>
                <TableHead className="hidden lg:table-cell">Assignee</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cases.map((c) => (
                <TableRow key={c.id} className="group">
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    <Link href={`/cases/${c.id}`} className="hover:underline">
                      {formatCaseNumber(c.caseNumber)}
                    </Link>
                  </TableCell>
                  <TableCell className="max-w-xs truncate font-medium">
                    <Link
                      href={`/cases/${c.id}`}
                      className="hover:underline focus-visible:underline focus-visible:outline-none"
                    >
                      {c.title}
                    </Link>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">
                    {c.department.name}
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">
                    {c.assignee?.name ?? "Unassigned"}
                  </TableCell>
                  <TableCell>
                    <PriorityBadge priority={c.priority} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={c.status} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
