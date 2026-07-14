"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import type { Role } from "@prisma/client";

import { navForRole } from "@/lib/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MobileNav({ role }: { role: Role }) {
  const pathname = usePathname();
  const items = navForRole(role);

  const activeHref = items
    .filter((i) => !i.soon && (pathname === i.href || pathname.startsWith(i.href + "/")))
    .reduce<string | null>(
      (best, i) => (i.href.length > (best?.length ?? -1) ? i.href : best),
      null,
    );

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="md:hidden"
        render={<Button variant="ghost" size="icon" aria-label="Open navigation" />}
      >
        <Menu className="h-5 w-5" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-52">
        {items.map((item) => {
          const Icon = item.icon;
          const active = item.href === activeHref;
          if (item.soon) {
            return (
              <DropdownMenuItem key={item.href} disabled>
                <Icon className="h-4 w-4" />
                {item.label}
              </DropdownMenuItem>
            );
          }
          return (
            <DropdownMenuItem
              key={item.href}
              render={<Link href={item.href} data-active={active} />}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
