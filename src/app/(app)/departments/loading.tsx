import { PageHeaderSkeleton, TableSkeleton } from "@/components/skeletons";

export default function DepartmentsLoading() {
  return (
    <>
      <PageHeaderSkeleton action />
      <TableSkeleton rows={5} columns={5} />
    </>
  );
}
