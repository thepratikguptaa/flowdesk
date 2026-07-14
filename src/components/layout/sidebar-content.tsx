"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Role } from "@prisma/client";

import { navForRole } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import {
  NotificationBell,
  type NotificationItem,
} from "@/components/layout/notification-bell";
import { SidebarUser } from "@/components/layout/sidebar-user";

export function SidebarContent({
  user,
  notifications,
  unreadCount,
  onNavigate,
}: {
  user: { name: string | null; email: string | null; role: Role };
  notifications: NotificationItem[];
  unreadCount: number;
  /** Called when a nav link is clicked (used to close the mobile drawer). */
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = navForRole(user.role);

  // Only the most specific matching route is active.
  const activeHref = items
    .filter((i) => !i.soon && (pathname === i.href || pathname.startsWith(i.href + "/")))
    .reduce<string | null>(
      (best, i) => (i.href.length > (best?.length ?? -1) ? i.href : best),
      null,
    );

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-14 items-center border-b px-5">
        <span className="font-heading text-lg font-semibold tracking-tight">
          FlowDesk
        </span>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const active = item.href === activeHref;
          const Icon = item.icon;

          if (item.soon) {
            return (
              <span
                key={item.href}
                className="flex cursor-not-allowed items-center justify-between rounded-md px-3 py-2 text-sm text-muted-foreground/60"
                aria-disabled
              >
                <span className="flex items-center gap-3">
                  <Icon className="h-4 w-4" />
                  {item.label}
                </span>
                <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide">
                  Soon
                </span>
              </span>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="space-y-1 border-t p-3">
        <NotificationBell
          notifications={notifications}
          unreadCount={unreadCount}
          variant="row"
        />
      </div>

      <div className="border-t p-3">
        <SidebarUser name={user.name} email={user.email} role={user.role} />
      </div>
    </div>
  );
}
