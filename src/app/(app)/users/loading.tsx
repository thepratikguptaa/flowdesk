import {
  PageHeaderSkeleton,
  FiltersSkeleton,
  TableSkeleton,
} from "@/components/skeletons";

export default function UsersLoading() {
  return (
    <>
      <PageHeaderSkeleton action />
      <FiltersSkeleton />
      <TableSkeleton rows={6} columns={6} />
    </>
  );
}
