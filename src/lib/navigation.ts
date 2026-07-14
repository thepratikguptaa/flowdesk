import type { Role } from "@prisma/client";
import {
  LayoutDashboard,
  Inbox,
  PlusCircle,
  Building2,
  BarChart3,
  Users,
  ScrollText,
  type LucideIcon,
} from "lucide-react";

import { atLeast } from "@/lib/auth/rbac";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Minimum role required to see this item. Defaults to CITIZEN (everyone). */
  minRole?: Role;
  /** Feature not built yet — rendered disabled. */
  soon?: boolean;
};

const NAV: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Cases", href: "/cases", icon: Inbox },
  { label: "New case", href: "/cases/new", icon: PlusCircle },
  { label: "Departments", href: "/departments", icon: Building2, minRole: "ADMIN" },
  { label: "Analytics", href: "/analytics", icon: BarChart3, minRole: "MANAGER" },
  { label: "Users", href: "/users", icon: Users, minRole: "ADMIN" },
  { label: "Audit log", href: "/audit", icon: ScrollText, minRole: "ADMIN" },
];

/** Nav items visible to a given role, in display order. */
export function navForRole(role: Role): NavItem[] {
  return NAV.filter((item) => !item.minRole || atLeast(role, item.minRole));
}
