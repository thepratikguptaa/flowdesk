"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Search, X } from "lucide-react";

import { STATUSES, PRIORITIES, STATUS_META, PRIORITY_META } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "__all__";

export function CaseFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");

  const apply = useCallback(
    (next: Record<string, string | null | undefined>) => {
      const sp = new URLSearchParams(params.toString());
      for (const [key, value] of Object.entries(next)) {
        if (!value || value === ALL) sp.delete(key);
        else sp.set(key, value);
      }
      startTransition(() => router.push(`/cases?${sp.toString()}`));
    },
    [params, router],
  );

  const hasFilters =
    !!params.get("q") || !!params.get("status") || !!params.get("priority");

  const statusItems = {
    [ALL]: "All statuses",
    ...Object.fromEntries(STATUSES.map((s) => [s, STATUS_META[s].label])),
  };
  const priorityItems = {
    [ALL]: "All priorities",
    ...Object.fromEntries(PRIORITIES.map((p) => [p, PRIORITY_META[p].label])),
  };

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          apply({ q });
        }}
        className="relative flex-1"
      >
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by title or case number…"
          className="pl-8"
          aria-label="Search cases"
        />
      </form>

      <Select
        value={params.get("status") ?? ALL}
        items={statusItems}
        onValueChange={(v) => apply({ status: v })}
      >
        <SelectTrigger className="w-full sm:w-44" aria-label="Filter by status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_META[s].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.get("priority") ?? ALL}
        items={priorityItems}
        onValueChange={(v) => apply({ priority: v })}
      >
        <SelectTrigger className="w-full sm:w-40" aria-label="Filter by priority">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All priorities</SelectItem>
          {PRIORITIES.map((p) => (
            <SelectItem key={p} value={p}>
              {PRIORITY_META[p].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {hasFilters && (
        <Button
          variant="ghost"
          size="icon"
          aria-label="Clear filters"
          disabled={pending}
          onClick={() => {
            setQ("");
            startTransition(() => router.push("/cases"));
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
