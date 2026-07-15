import {
  PageHeaderSkeleton,
  StatCardsSkeleton,
  ChartCardSkeleton,
} from "@/components/skeletons";

export default function DashboardLoading() {
  return (
    <>
      <PageHeaderSkeleton action />
      <StatCardsSkeleton count={4} />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
    </>
  );
}
