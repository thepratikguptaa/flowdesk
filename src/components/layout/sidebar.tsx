import type { Role } from "@prisma/client";

import { SidebarContent } from "@/components/layout/sidebar-content";
import type { NotificationItem } from "@/components/layout/notification-bell";

export function Sidebar({
  user,
  notifications,
  unreadCount,
}: {
  user: { name: string | null; email: string | null; role: Role };
  notifications: NotificationItem[];
  unreadCount: number;
}) {
  return (
    <aside className="hidden w-60 shrink-0 border-r md:block">
      <SidebarContent user={user} notifications={notifications} unreadCount={unreadCount} />
    </aside>
  );
}
