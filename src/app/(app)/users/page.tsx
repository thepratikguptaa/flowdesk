import type { Metadata } from "next";
import { Prisma, type Role } from "@prisma/client";
import { Plus, Users as UsersIcon } from "lucide-react";

import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { ROLES, ROLE_META } from "@/lib/constants";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { UserFormDialog } from "@/components/users/user-form-dialog";
import { UserRowActions } from "@/components/users/user-row-actions";
import { UserFilters } from "@/components/users/user-filters";

export const metadata: Metadata = { title: "Users" };

type SP = { q?: string; role?: string; status?: string };

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const admin = await requireRole("ADMIN");
  const sp = await searchParams;

  const filters: Prisma.UserWhereInput[] = [];
  if (sp.role && (ROLES as string[]).includes(sp.role)) {
    filters.push({ role: sp.role as Role });
  }
  if (sp.status === "active") filters.push({ isActive: true });
  if (sp.status === "inactive") filters.push({ isActive: false });
  if (sp.q?.trim()) {
    const q = sp.q.trim();
    filters.push({
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ],
    });
  }

  const [users, departments] = await Promise.all([
    prisma.user.findMany({
      where: filters.length ? { AND: filters } : undefined,
      orderBy: [{ isActive: "desc" }, { name: "asc" }],
      include: {
        department: { select: { name: true } },
        _count: { select: { assignedCases: true } },
      },
    }),
    prisma.department.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Users"
        description="Manage accounts, roles, and department membership."
        action={
          <UserFormDialog
            departments={departments}
            trigger={
              <Button>
                <Plus className="h-4 w-4" />
                New user
              </Button>
            }
          />
        }
      />

      <div className="mb-4">
        <UserFilters />
      </div>

      {users.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <UsersIcon className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">No users match</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Try clearing the filters, or add a new user.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden sm:table-cell">Role</TableHead>
                <TableHead className="hidden lg:table-cell">Department</TableHead>
                <TableHead className="hidden md:table-cell text-center">Assigned</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-32 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const isSelf = u.id === admin.id;
                return (
                  <TableRow key={u.id} className={cn(!u.isActive && "opacity-60")}>
                    <TableCell>
                      <div className="font-medium">
                        {u.name}
                        {isSelf && (
                          <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                            (you)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                      {/* Role/department repeat inline on small screens where those columns are hidden. */}
                      <div className="mt-1 flex items-center gap-1.5 sm:hidden">
                        <Badge variant="secondary" className={ROLE_META[u.role].className}>
                          {ROLE_META[u.role].label}
                        </Badge>
                        {u.department && (
                          <span className="text-xs text-muted-foreground">
                            {u.department.name}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="secondary" className={ROLE_META[u.role].className}>
                        {ROLE_META[u.role].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-muted-foreground">
                      {u.department?.name ?? "—"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-center">
                      <Badge variant="secondary">{u._count.assignedCases}</Badge>
                    </TableCell>
                    <TableCell>
                      {u.isActive ? (
                        <Badge
                          variant="secondary"
                          className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                        >
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-muted-foreground">
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <UserRowActions
                        user={{
                          id: u.id,
                          name: u.name,
                          email: u.email,
                          role: u.role,
                          departmentId: u.departmentId,
                          isActive: u.isActive,
                        }}
                        departments={departments}
                        isSelf={isSelf}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
