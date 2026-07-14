import type { Role } from "@prisma/client";

import { MobileSidebar } from "@/components/layout/mobile-sidebar";
import type { NotificationItem } from "@/components/layout/notification-bell";

// Compact header shown only on small screens. The menu button opens the full
// sidebar (nav + notifications + account) as a left drawer.
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
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4 md:hidden">
      <MobileSidebar user={user} notifications={notifications} unreadCount={unreadCount} />
      <span className="font-heading font-semibold tracking-tight">FlowDesk</span>
    </header>
  );
}
