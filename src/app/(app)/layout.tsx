import type { ReactNode } from "react";

import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileHeader } from "@/components/layout/mobile-header";

export default async function AppLayout({ children }: { children: ReactNode }) {
  const user = await requireUser();
  const sessionUser = { name: user.name, email: user.email, role: user.role };

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: { id: true, message: true, caseId: true, read: true, createdAt: true },
    }),
    prisma.notification.count({ where: { userId: user.id, read: false } }),
  ]);

  return (
    <div className="flex h-dvh overflow-hidden bg-muted/30">
      <Sidebar
        user={sessionUser}
        notifications={notifications}
        unreadCount={unreadCount}
      />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <MobileHeader
          user={sessionUser}
          notifications={notifications}
          unreadCount={unreadCount}
        />
        <main className="flex-1 overflow-y-auto px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
