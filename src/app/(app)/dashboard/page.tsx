import type { Metadata } from "next";
import Link from "next/link";
import { PlusCircle, Inbox, AlertTriangle, CheckCircle2, Timer, BarChart3 } from "lucide-react";

import { requireUser } from "@/lib/auth/session";
import { getDashboardStats, getRecentActivity, formatDuration } from "@/lib/cases/stats";
import { can } from "@/lib/auth/rbac";
import { formatCaseNumber } from "@/lib/constants";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Dashboard" };

function relative(d: Date) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

function StatCard({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  icon: typeof Inbox;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <span className={`flex h-10 w-10 items-center justify-center rounded-sm ${accent ?? "bg-muted text-muted-foreground"}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const firstName = user.name?.split(" ")[0] ?? "there";
  const [stats, activity] = await Promise.all([
    getDashboardStats(user),
    getRecentActivity(user),
  ]);

  const maxDept = Math.max(1, ...stats.byDepartment.map((d) => d.count));

  return (
    <>
      <PageHeader
        title={`Welcome back, ${firstName}`}
        description="Your case activity at a glance."
        action={
          <div className="flex gap-2">
            {can(user.role, "analytics:view") && (
              <Button variant="outline" render={<Link href="/analytics" />}>
                <BarChart3 className="h-4 w-4" />
                Analytics
              </Button>
            )}
            <Button render={<Link href="/cases/new" />}>
              <PlusCircle className="h-4 w-4" />
              New case
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Open cases" value={stats.open} icon={Inbox} accent="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" />
        <StatCard label="Overdue" value={stats.overdue} icon={AlertTriangle} accent="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300" />
        <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} accent="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" />
        <StatCard label="Avg. resolution" value={formatDuration(stats.avgResolutionHours)} icon={Timer} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Cases by department</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.byDepartment.length === 0 ? (
              <p className="text-sm text-muted-foreground">No cases yet.</p>
            ) : (
              <ul className="space-y-3">
                {stats.byDepartment.map((d) => (
                  <li key={d.name}>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span>{d.name}</span>
                      <span className="tabular-nums text-muted-foreground">{d.count}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-sm bg-muted">
                      <div
                        className="h-full rounded-sm bg-primary"
                        style={{ width: `${(d.count / maxDept) * 100}%` }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground">No activity yet.</p>
            ) : (
              <ul className="space-y-3">
                {activity.map((e) => (
                  <li key={e.id} className="text-sm">
                    <Link href={`/cases/${e.case.id}`} className="group flex flex-col">
                      <span className="group-hover:underline">{e.message}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatCaseNumber(e.case.caseNumber)} · {relative(e.createdAt)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
