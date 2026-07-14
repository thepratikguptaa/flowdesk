import type { Metadata } from "next";
import Link from "next/link";
import { ScrollText } from "lucide-react";
import type { Prisma, CaseStatus, Priority } from "@prisma/client";

import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { STATUS_META, PRIORITY_META } from "@/lib/constants";
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
import { AuditFilters } from "@/components/audit/audit-filters";

export const metadata: Metadata = { title: "Audit log" };

const PAGE_SIZE = 50;

function when(d: Date) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ entity?: string; q?: string; page?: string }>;
}) {
  await requireRole("ADMIN");
  const sp = await searchParams;
  const page = Math.max(1, Number(sp.page ?? "1") || 1);

  const filters: Prisma.AuditLogWhereInput[] = [];
  if (sp.entity && ["Case", "Department", "User"].includes(sp.entity)) {
    filters.push({ entityType: sp.entity });
  }
  if (sp.q?.trim()) {
    filters.push({ action: { contains: sp.q.trim(), mode: "insensitive" } });
  }
  const where: Prisma.AuditLogWhereInput = filters.length ? { AND: filters } : {};

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { name: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Resolve user ids referenced by assignment changes → names.
  const userIds = new Set<string>();
  for (const log of logs) {
    if (log.field === "assigneeId") {
      if (log.oldValue) userIds.add(log.oldValue);
      if (log.newValue) userIds.add(log.newValue);
    }
  }
  const userRows = await prisma.user.findMany({
    where: { id: { in: [...userIds] } },
    select: { id: true, name: true },
  });
  const userName = new Map(userRows.map((u) => [u.id, u.name]));

  // Humanize a stored old/new value for display.
  function fmtValue(field: string | null, value: string | null): string {
    if (field === "assigneeId") {
      return value ? (userName.get(value) ?? "Unknown user") : "Unassigned";
    }
    if (value === null) return "—";
    if (field === "status") return STATUS_META[value as CaseStatus]?.label ?? value;
    if (field === "priority") return PRIORITY_META[value as Priority]?.label ?? value;
    if (field === "dueDate") {
      const d = new Date(value);
      return Number.isNaN(d.getTime())
        ? value
        : new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(d);
    }
    return value;
  }

  const qs = (p: number) => {
    const s = new URLSearchParams();
    if (sp.entity) s.set("entity", sp.entity);
    if (sp.q) s.set("q", sp.q);
    s.set("page", String(p));
    return `/audit?${s.toString()}`;
  };

  return (
    <>
      <PageHeader
        title="Audit log"
        description="Immutable record of every action across FlowDesk."
      />

      <div className="mb-4">
        <AuditFilters />
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <ScrollText className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">No audit entries</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Actions will appear here as users work.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-44">Time</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Change</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                    {when(log.createdAt)}
                  </TableCell>
                  <TableCell className="text-sm">{log.user?.name ?? "System"}</TableCell>
                  <TableCell>
                    <code className="rounded-sm bg-muted px-1.5 py-0.5 text-xs">{log.action}</code>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{log.entityType}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {log.field ? (
                      <span>
                        <span className="font-medium text-foreground">{log.field}</span>:{" "}
                        {fmtValue(log.field, log.oldValue)} → {fmtValue(log.field, log.newValue)}
                      </span>
                    ) : (
                      (log.newValue ?? log.oldValue ?? "—")
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Page {page} of {totalPages} · {total} entries
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} render={<Link href={qs(page - 1)} />}>
              Previous
            </Button>
            <Button variant="outline" size="sm" disabled={page >= totalPages} render={<Link href={qs(page + 1)} />}>
              Next
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
