"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { assignCase } from "@/lib/actions/workflow";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const UNASSIGNED = "__unassigned__";

type Member = { id: string; name: string };

export function CaseAssignControl({
  caseId,
  assigneeId,
  members,
}: {
  caseId: string;
  assigneeId: string | null;
  members: Member[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(assigneeId ?? UNASSIGNED);

  const items = {
    [UNASSIGNED]: "Unassigned",
    ...Object.fromEntries(members.map((m) => [m.id, m.name])),
  };

  function onChange(selected: string | null) {
    const sel = selected ?? UNASSIGNED;
    const previous = value;
    setValue(sel); // controlled: reflect selection immediately
    const next = sel === UNASSIGNED ? null : sel;
    startTransition(async () => {
      const res = await assignCase(caseId, next);
      if (res.ok) {
        toast.success(next ? "Case assigned" : "Case unassigned");
        router.refresh();
      } else {
        toast.error(res.error ?? "Could not assign");
        setValue(previous); // revert on failure
      }
    });
  }

  return (
    <Select
      value={value}
      items={items}
      disabled={pending}
      onValueChange={onChange}
    >
      <SelectTrigger className="w-full" aria-label="Assign case">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={UNASSIGNED}>Unassigned</SelectItem>
        {members.map((m) => (
          <SelectItem key={m.id} value={m.id}>
            {m.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
