import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/** Mirrors <PageHeader/>: title + description, with an optional action button. */
export function PageHeaderSkeleton({ action = false }: { action?: boolean }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-7 w-52" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      {action && <Skeleton className="h-9 w-32 shrink-0" />}
    </div>
  );
}

/** Mirrors the search + dropdowns filter bar (cases, users, audit). */
export function FiltersSkeleton() {
  return (
    <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
      <Skeleton className="h-9 flex-1" />
      <Skeleton className="h-9 w-full sm:w-40" />
      <Skeleton className="h-9 w-full sm:w-44" />
    </div>
  );
}

/** Mirrors the bordered data tables (departments, cases, users, audit). */
export function TableSkeleton({
  rows = 6,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="overflow-hidden rounded-xl border bg-card">
      <div className="flex items-center gap-4 border-b px-4 py-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-3.5 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={r}
          className="flex items-center gap-4 border-b px-4 py-4 last:border-b-0"
        >
          {Array.from({ length: columns }).map((_, c) => (
            <Skeleton
              key={c}
              className={cn("h-4 flex-1", c === 0 && "max-w-[40%]")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Mirrors the KPI tile row on the dashboard/analytics. */
export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-sm" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-14" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Mirrors a titled chart/content card. */
export function ChartCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border bg-card p-6", className)}>
      <Skeleton className="h-5 w-40" />
      <Skeleton className="mt-6 h-48 w-full" />
    </div>
  );
}

/** A single labelled field (label + control). */
function FieldSkeleton({ tall = false }: { tall?: boolean }) {
  return (
    <div className="space-y-1.5">
      <Skeleton className="h-4 w-24" />
      <Skeleton className={tall ? "h-32 w-full" : "h-9 w-full"} />
    </div>
  );
}

/** Mirrors the case create/edit form (max-w-2xl → header → card → fields). */
export function CaseFormSkeleton({
  withAttachments = false,
}: {
  withAttachments?: boolean;
}) {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeaderSkeleton />
      <div className="rounded-xl border bg-card p-6">
        <div className="space-y-6">
          <FieldSkeleton />
          <FieldSkeleton tall />
          <div className="grid gap-4 sm:grid-cols-2">
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
            <FieldSkeleton />
          </div>
          {withAttachments && <FieldSkeleton />}
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}
