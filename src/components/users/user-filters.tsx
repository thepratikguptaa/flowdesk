"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Search, X } from "lucide-react";

import { ROLES, ROLE_META } from "@/lib/constants";
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

export function UserFilters() {
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
      startTransition(() => router.push(`/users?${sp.toString()}`));
    },
    [params, router],
  );

  const hasFilters =
    !!params.get("q") || !!params.get("role") || !!params.get("status");

  const roleItems = {
    [ALL]: "All roles",
    ...Object.fromEntries(ROLES.map((r) => [r, ROLE_META[r].label])),
  };
  const statusItems = {
    [ALL]: "Active & inactive",
    active: "Active only",
    inactive: "Inactive only",
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
          placeholder="Search by name or email…"
          className="pl-8"
          aria-label="Search users"
        />
      </form>

      <Select
        value={params.get("role") ?? ALL}
        items={roleItems}
        onValueChange={(v) => apply({ role: v })}
      >
        <SelectTrigger className="w-full sm:w-40" aria-label="Filter by role">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All roles</SelectItem>
          {ROLES.map((r) => (
            <SelectItem key={r} value={r}>
              {ROLE_META[r].label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.get("status") ?? ALL}
        items={statusItems}
        onValueChange={(v) => apply({ status: v })}
      >
        <SelectTrigger className="w-full sm:w-44" aria-label="Filter by status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Active &amp; inactive</SelectItem>
          <SelectItem value="active">Active only</SelectItem>
          <SelectItem value="inactive">Inactive only</SelectItem>
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
            startTransition(() => router.push("/users"));
          }}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
