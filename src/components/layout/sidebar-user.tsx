"use client";

import { LogOut } from "lucide-react";

import { logoutAction } from "@/lib/actions/logout";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const ROLE_LABEL: Record<string, string> = {
  CITIZEN: "Citizen",
  STAFF: "Staff",
  MANAGER: "Department Manager",
  ADMIN: "Administrator",
};

function initials(name: string | null, email: string | null) {
  const src = name?.trim() || email || "?";
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

export function SidebarUser({
  name,
  email,
  role,
}: {
  name: string | null;
  email: string | null;
  role: string;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <Avatar className="h-8 w-8">
        <AvatarFallback className="text-xs font-medium">
          {initials(name, email)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {ROLE_LABEL[role] ?? role}
        </p>
      </div>
      <button
        type="button"
        onClick={() => logoutAction()}
        aria-label="Sign out"
        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <LogOut className="h-4 w-4" />
      </button>
    </div>
  );
}
