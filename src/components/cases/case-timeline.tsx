import type { CaseEventType } from "@prisma/client";
import {
  Circle,
  FilePlus2,
  RefreshCw,
  UserPlus,
  Flag,
  MessageSquare,
  Paperclip,
  RotateCcw,
  CheckCircle2,
  ArrowUpCircle,
} from "lucide-react";

import { cn } from "@/lib/utils";

type TimelineEvent = {
  id: string;
  type: CaseEventType;
  message: string;
  createdAt: Date;
  actor: { name: string | null } | null;
};

const ICONS: Record<CaseEventType, typeof Circle> = {
  CREATED: FilePlus2,
  STATUS_CHANGED: RefreshCw,
  ASSIGNED: UserPlus,
  PRIORITY_CHANGED: Flag,
  COMMENT_ADDED: MessageSquare,
  ATTACHMENT_ADDED: Paperclip,
  REOPENED: RotateCcw,
  CLOSED: CheckCircle2,
  ESCALATED: ArrowUpCircle,
};

function formatted(d: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

export function CaseTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  }

  return (
    <ol>
      {events.map((event, i) => {
        const Icon = ICONS[event.type] ?? Circle;
        const isLast = i === events.length - 1;
        return (
          <li key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
            {/* Connector line, centered under the 24px icon (center at 12px). */}
            {!isLast && (
              <span className="absolute bottom-0 left-3 top-6 w-px -translate-x-1/2 bg-border" />
            )}
            <span
              className={cn(
                "relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border bg-background",
              )}
            >
              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <p className="text-sm">{event.message}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {event.actor?.name ? `${event.actor.name} · ` : ""}
                {formatted(event.createdAt)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
