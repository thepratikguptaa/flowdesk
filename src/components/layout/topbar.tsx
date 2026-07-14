import type { Role } from "@prisma/client";

import { MobileNav } from "@/components/layout/mobile-nav";
import { UserMenu } from "@/components/layout/user-menu";

export function Topbar({
  user,
}: {
  user: { name: string | null; email: string | null; role: Role };
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-2">
        <MobileNav role={user.role} />
        <span className="font-heading font-semibold tracking-tight md:hidden">
          FlowDesk
        </span>
      </div>
      <UserMenu name={user.name} email={user.email} role={user.role} />
    </header>
  );
}
