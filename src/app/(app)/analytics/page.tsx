import type { Metadata } from "next";

import { requireRole } from "@/lib/auth/session";
import {
  getDashboardStats,
  getCreationTrend,
  getStaffWorkload,
  formatDuration,
} from "@/lib/cases/stats";
import { STATUS_META, PRIORITY_META } from "@/lib/constants";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarStat, TrendLine } from "@/components/analytics/analytics-charts";

export const metadata: Metadata = { title: "Analytics" };

export default async function AnalyticsPage() {
  const user = await requireRole("MANAGER");

  const [stats, trend, workload] = await Promise.all([
    getDashboardStats(user),
    getCreationTrend(user, 8),
    getStaffWorkload(user),
  ]);

  const byStatus = stats.byStatus
    .map((s) => ({ label: STATUS_META[s.status].label, count: s.count }))
    .sort((a, b) => b.count - a.count);
  const byPriority = ["URGENT", "HIGH", "MEDIUM", "LOW"].map((p) => ({
    label: PRIORITY_META[p as keyof typeof PRIORITY_META].label,
    count: stats.byPriority.find((x) => x.priority === p)?.count ?? 0,
  }));
  const total = stats.open + stats.resolved + stats.closed;

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Trends and workload across the cases you oversee."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total cases" value={total} />
        <Stat label="Open" value={stats.open} />
        <Stat label="Overdue" value={stats.overdue} />
        <Stat label="Avg. resolution" value={formatDuration(stats.avgResolutionHours)} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCard title="Cases created (last 8 weeks)">
          <TrendLine data={trend} />
        </ChartCard>

        <ChartCard title="Cases by status">
          <BarStat data={byStatus} />
        </ChartCard>

        <ChartCard title="Cases by department">
          <BarStat
            data={stats.byDepartment.map((d) => ({ label: d.name, count: d.count }))}
            horizontal
          />
        </ChartCard>

        <ChartCard title="Priority distribution">
          <BarStat data={byPriority} />
        </ChartCard>

        <div className="lg:col-span-2">
          <ChartCard title="Staff workload (open cases)">
            <BarStat
              data={workload.map((w) => ({ label: w.name, count: w.count }))}
              horizontal
            />
          </ChartCard>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="py-5">
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </CardContent>
    </Card>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
