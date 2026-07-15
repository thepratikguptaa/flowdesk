import {
  PageHeaderSkeleton,
  FiltersSkeleton,
  TableSkeleton,
} from "@/components/skeletons";

export default function AuditLoading() {
  return (
    <>
      <PageHeaderSkeleton />
      <FiltersSkeleton />
      <TableSkeleton rows={8} columns={5} />
    </>
  );
}
