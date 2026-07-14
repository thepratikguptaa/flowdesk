"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  XAxis,
  YAxis,
} from "recharts";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

type Datum = { label: string; count: number };

const config = {
  count: { label: "Cases", color: "var(--primary)" },
} satisfies ChartConfig;

/** Vertical single-hue bar chart — identity comes from the axis labels. */
export function BarStat({ data, horizontal }: { data: Datum[]; horizontal?: boolean }) {
  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">No data yet.</p>;
  }

  return (
    <ChartContainer config={config} className="h-[240px] w-full">
      <BarChart
        accessibilityLayer
        data={data}
        layout={horizontal ? "vertical" : "horizontal"}
        margin={{ left: horizontal ? 8 : 0, right: 8, top: 4, bottom: 0 }}
      >
        <CartesianGrid vertical={false} stroke="var(--border)" />
        {horizontal ? (
          <>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="label"
              tickLine={false}
              axisLine={false}
              width={110}
              tick={{ fontSize: 12 }}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 12 }}
              interval={0}
            />
            <YAxis tickLine={false} axisLine={false} width={28} allowDecimals={false} tick={{ fontSize: 12 }} />
          </>
        )}
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar dataKey="count" fill="var(--color-count)" radius={4} />
      </BarChart>
    </ChartContainer>
  );
}

/** Change-over-time line chart (single series). */
export function TrendLine({ data }: { data: Datum[] }) {
  return (
    <ChartContainer config={config} className="h-[240px] w-full">
      <LineChart accessibilityLayer data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
        <YAxis tickLine={false} axisLine={false} width={28} allowDecimals={false} tick={{ fontSize: 12 }} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          dataKey="count"
          type="monotone"
          stroke="var(--color-count)"
          strokeWidth={2}
          dot={{ r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
