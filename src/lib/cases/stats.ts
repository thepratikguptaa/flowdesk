import type { CaseStatus, Priority } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import type { SessionUser } from "@/lib/auth/session";
import { caseListWhere } from "@/lib/cases/scope";
import { OPEN_STATUSES } from "@/lib/cases/workflow";

export type DashboardStats = {
  open: number;
  resolved: number;
  closed: number;
  overdue: number;
  avgResolutionHours: number | null;
  byDepartment: { name: string; count: number }[];
  byStatus: { status: CaseStatus; count: number }[];
  byPriority: { priority: Priority; count: number }[];
};

/**
 * Aggregate case metrics for the dashboard, scoped to what the user may see.
 * All counts respect the same RBAC filter used by the case list.
 */
export async function getDashboardStats(user: SessionUser): Promise<DashboardStats> {
  const scope = caseListWhere(user);
  const now = new Date();

  const [open, resolved, closed, overdue, resolvedCases, byDeptRaw, byStatusRaw, byPriorityRaw] =
    await Promise.all([
      prisma.case.count({ where: { AND: [scope, { status: { in: OPEN_STATUSES } }] } }),
      prisma.case.count({ where: { AND: [scope, { status: "RESOLVED" }] } }),
      prisma.case.count({ where: { AND: [scope, { status: "CLOSED" }] } }),
      prisma.case.count({
        where: {
          AND: [scope, { status: { in: OPEN_STATUSES }, dueDate: { lt: now } }],
        },
      }),
      prisma.case.findMany({
        where: { AND: [scope, { resolvedAt: { not: null } }] },
        select: { createdAt: true, resolvedAt: true },
        take: 500,
      }),
      prisma.case.groupBy({
        by: ["departmentId"],
        where: scope,
        _count: { _all: true },
      }),
      prisma.case.groupBy({
        by: ["status"],
        where: scope,
        _count: { _all: true },
      }),
      prisma.case.groupBy({
        by: ["priority"],
        where: scope,
        _count: { _all: true },
      }),
    ]);

  // Average resolution time in hours.
  let avgResolutionHours: number | null = null;
  if (resolvedCases.length > 0) {
    const totalMs = resolvedCases.reduce(
      (sum, c) => sum + (c.resolvedAt!.getTime() - c.createdAt.getTime()),
      0,
    );
    avgResolutionHours = totalMs / resolvedCases.length / (1000 * 60 * 60);
  }

  // Resolve department names for the grouped counts.
  const deptIds = byDeptRaw.map((d) => d.departmentId);
  const depts = await prisma.department.findMany({
    where: { id: { in: deptIds } },
    select: { id: true, name: true },
  });
  const deptName = new Map(depts.map((d) => [d.id, d.name]));
  const byDepartment = byDeptRaw
    .map((d) => ({ name: deptName.get(d.departmentId) ?? "Unknown", count: d._count._all }))
    .sort((a, b) => b.count - a.count);

  return {
    open,
    resolved,
    closed,
    overdue,
    avgResolutionHours,
    byDepartment,
    byStatus: byStatusRaw.map((s) => ({ status: s.status, count: s._count._all })),
    byPriority: byPriorityRaw.map((p) => ({ priority: p.priority, count: p._count._all })),
  };
}

/** Recent activity feed (timeline events across the user's visible cases). */
export async function getRecentActivity(user: SessionUser, take = 8) {
  const scope = caseListWhere(user);
  return prisma.caseEvent.findMany({
    where: { case: scope },
    orderBy: { createdAt: "desc" },
    take,
    include: {
      actor: { select: { name: true } },
      case: { select: { id: true, caseNumber: true, title: true } },
    },
  });
}

/** Weekly case-creation counts for the last `weeks` weeks (oldest → newest). */
export async function getCreationTrend(user: SessionUser, weeks = 8) {
  const scope = caseListWhere(user);
  const now = new Date();
  const start = new Date(now);
  start.setDate(start.getDate() - weeks * 7);
  start.setHours(0, 0, 0, 0);

  const rows = await prisma.case.findMany({
    where: { AND: [scope, { createdAt: { gte: start } }] },
    select: { createdAt: true },
  });

  // Bucket into week indices from `start`.
  const buckets = Array.from({ length: weeks }, (_, i) => {
    const weekStart = new Date(start);
    weekStart.setDate(start.getDate() + i * 7);
    return {
      label: new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" }).format(weekStart),
      count: 0,
    };
  });
  for (const r of rows) {
    const idx = Math.min(
      weeks - 1,
      Math.floor((r.createdAt.getTime() - start.getTime()) / (7 * 24 * 60 * 60 * 1000)),
    );
    if (idx >= 0) buckets[idx].count++;
  }
  return buckets;
}

/** Open-case counts per assignee (workload). Managers/admins only in practice. */
export async function getStaffWorkload(user: SessionUser) {
  const scope = caseListWhere(user);
  const grouped = await prisma.case.groupBy({
    by: ["assigneeId"],
    where: { AND: [scope, { status: { in: OPEN_STATUSES }, assigneeId: { not: null } }] },
    _count: { _all: true },
  });
  const ids = grouped.map((g) => g.assigneeId!).filter(Boolean);
  const users = await prisma.user.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true },
  });
  const nameOf = new Map(users.map((u) => [u.id, u.name]));
  return grouped
    .map((g) => ({ name: nameOf.get(g.assigneeId!) ?? "Unknown", count: g._count._all }))
    .sort((a, b) => b.count - a.count);
}

export function formatDuration(hours: number | null): string {
  if (hours === null) return "—";
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 48) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
}
