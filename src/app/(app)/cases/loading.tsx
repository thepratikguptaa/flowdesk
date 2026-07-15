import {
  PageHeaderSkeleton,
  FiltersSkeleton,
  TableSkeleton,
} from "@/components/skeletons";

export default function CasesLoading() {
  return (
    <>
      <PageHeaderSkeleton action />
      <FiltersSkeleton />
      <TableSkeleton rows={8} columns={5} />
    </>
  );
}
