import {
  PageHeaderSkeleton,
  StatCardsSkeleton,
  ChartCardSkeleton,
} from "@/components/skeletons";

export default function AnalyticsLoading() {
  return (
    <>
      <PageHeaderSkeleton />
      <StatCardsSkeleton count={4} />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
        <ChartCardSkeleton />
        <ChartCardSkeleton />
        <ChartCardSkeleton className="lg:col-span-2" />
      </div>
    </>
  );
}
