"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";

import {
  markNotificationRead,
  markAllNotificationsRead,
} from "@/lib/actions/notifications";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type NotificationItem = {
  id: string;
  message: string;
  caseId: string | null;
  read: boolean;
  createdAt: Date;
};

function when(d: Date) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeStyle: "short" }).format(
    new Date(d),
  );
}

export function NotificationBell({
  notifications,
  unreadCount,
  variant = "icon",
}: {
  notifications: NotificationItem[];
  unreadCount: number;
  variant?: "icon" | "row";
}) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function openNotification(n: NotificationItem) {
    startTransition(async () => {
      if (!n.read) await markNotificationRead(n.id);
      if (n.caseId) router.push(`/cases/${n.caseId}`);
      router.refresh();
    });
  }

  function markAll() {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  const iconTrigger = (
    <DropdownMenuTrigger
      render={<Button variant="ghost" size="icon" aria-label="Notifications" />}
    >
      <span className="relative">
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </span>
    </DropdownMenuTrigger>
  );

  const rowTrigger = (
    <DropdownMenuTrigger className="flex w-full cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-ring">
      <Bell className="h-4 w-4" />
      <span className="flex-1 text-left">Notifications</span>
      {unreadCount > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </DropdownMenuTrigger>
  );

  return (
    <DropdownMenu>
      {variant === "row" ? rowTrigger : iconTrigger}
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-medium">Notifications</span>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAll}
              className="cursor-pointer text-xs text-primary hover:underline"
            >
              Mark all read
            </button>
          )}
        </div>

        {notifications.length === 0 ? (
          <p className="px-3 py-6 text-center text-sm text-muted-foreground">
            You’re all caught up.
          </p>
        ) : (
          <ul className="max-h-80 overflow-y-auto">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => openNotification(n)}
                  className="flex w-full cursor-pointer flex-col gap-0.5 border-b px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-muted/60"
                >
                  <span className="flex items-start gap-2 text-sm">
                    {!n.read && (
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    )}
                    <span className={n.read ? "text-muted-foreground" : ""}>{n.message}</span>
                  </span>
                  <span className="pl-0 text-xs text-muted-foreground">{when(n.createdAt)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
