"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import type { Role } from "@prisma/client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SidebarContent } from "@/components/layout/sidebar-content";
import type { NotificationItem } from "@/components/layout/notification-bell";

export function MobileSidebar({
  user,
  notifications,
  unreadCount,
}: {
  user: { name: string | null; email: string | null; role: Role };
  notifications: NotificationItem[];
  unreadCount: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="ghost" size="icon" aria-label="Open menu" />}>
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <SheetTitle className="sr-only">Navigation</SheetTitle>
        <SidebarContent
          user={user}
          notifications={notifications}
          unreadCount={unreadCount}
          onNavigate={() => setOpen(false)}
        />
      </SheetContent>
    </Sheet>
  );
}
