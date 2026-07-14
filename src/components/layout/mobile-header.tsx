import type { Role } from "@prisma/client";

import { MobileNav } from "@/components/layout/mobile-nav";
import { UserMenu } from "@/components/layout/user-menu";
import {
  NotificationBell,
  type NotificationItem,
} from "@/components/layout/notification-bell";

// Compact header shown only on small screens, where the sidebar is hidden.
export function MobileHeader({
  user,
  notifications,
  unreadCount,
}: {
  user: { name: string | null; email: string | null; role: Role };
  notifications: NotificationItem[];
  unreadCount: number;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b bg-background px-4 md:hidden">
      <div className="flex items-center gap-2">
        <MobileNav role={user.role} />
        <span className="font-heading font-semibold tracking-tight">FlowDesk</span>
      </div>
      <div className="flex items-center gap-1">
        <NotificationBell notifications={notifications} unreadCount={unreadCount} />
        <UserMenu name={user.name} email={user.email} role={user.role} />
      </div>
    </header>
  );
}
