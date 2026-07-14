"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const ALL = "__all__";
const ENTITIES = ["Case", "Department", "User"];

export function AuditFilters() {
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(params.get("q") ?? "");

  const items = {
    [ALL]: "All entities",
    ...Object.fromEntries(ENTITIES.map((e) => [e, e])),
  };

  function apply(next: Record<string, string | null | undefined>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(next)) {
      if (!v || v === ALL) sp.delete(k);
      else sp.set(k, v);
    }
    sp.delete("page");
    startTransition(() => router.push(`/audit?${sp.toString()}`));
  }

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
          placeholder="Search by action (e.g. case.status)…"
          className="pl-8"
          aria-label="Search audit log"
        />
      </form>
      <Select
        defaultValue={params.get("entity") ?? ALL}
        items={items}
        onValueChange={(v) => apply({ entity: v })}
      >
        <SelectTrigger className="w-full sm:w-48" aria-label="Filter by entity">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All entities</SelectItem>
          {ENTITIES.map((e) => (
            <SelectItem key={e} value={e}>
              {e}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
