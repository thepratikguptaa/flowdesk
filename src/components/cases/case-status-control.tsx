"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import type { CaseStatus } from "@prisma/client";

import { changeCaseStatus } from "@/lib/actions/workflow";
import { STATUS_META } from "@/lib/constants";
import { StatusBadge } from "@/components/cases/case-badges";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function CaseStatusControl({
  caseId,
  status,
  targets,
}: {
  caseId: string;
  status: CaseStatus;
  targets: CaseStatus[];
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function move(to: CaseStatus) {
    startTransition(async () => {
      const res = await changeCaseStatus(caseId, to);
      if (res.ok) {
        toast.success(`Status changed to ${STATUS_META[to].label}`);
        router.refresh();
      } else {
        toast.error(res.error ?? "Could not change status");
      }
    });
  }

  if (targets.length === 0) {
    return <StatusBadge status={status} />;
  }

  return (
    <div className="flex items-center gap-2">
      <StatusBadge status={status} />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="outline" size="sm" disabled={pending} />}
        >
          Change status
          <ChevronDown className="h-4 w-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {targets.map((to) => (
            <DropdownMenuItem key={to} onClick={() => move(to)}>
              {STATUS_META[to].label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
