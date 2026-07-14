import type { Metadata } from "next";
import { Plus, Pencil, Building2 } from "lucide-react";

import { requireRole } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
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
import { DepartmentFormDialog } from "@/components/departments/department-form-dialog";
import { DeleteDepartmentDialog } from "@/components/departments/delete-department-dialog";

export const metadata: Metadata = { title: "Departments" };

export default async function DepartmentsPage() {
  await requireRole("ADMIN");

  const departments = await prisma.department.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { cases: true, users: true } } },
  });

  return (
    <>
      <PageHeader
        title="Departments"
        description="Create and manage the departments that cases are routed to."
        action={
          <DepartmentFormDialog
            trigger={
              <Button>
                <Plus className="h-4 w-4" />
                New department
              </Button>
            }
          />
        }
      />

      {departments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
          <Building2 className="mb-3 h-8 w-8 text-muted-foreground" />
          <p className="font-medium">No departments yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first department to start routing cases.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead className="hidden md:table-cell">Description</TableHead>
                <TableHead className="text-center">Staff</TableHead>
                <TableHead className="text-center">Cases</TableHead>
                <TableHead className="w-24 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {departments.map((dept) => (
                <TableRow key={dept.id}>
                  <TableCell className="font-medium">{dept.name}</TableCell>
                  <TableCell className="hidden max-w-md truncate text-muted-foreground md:table-cell">
                    {dept.description || "—"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{dept._count.users}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{dept._count.cases}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <DepartmentFormDialog
                        department={{
                          id: dept.id,
                          name: dept.name,
                          description: dept.description,
                        }}
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={`Edit ${dept.name}`}
                          >
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        }
                      />
                      <DeleteDepartmentDialog
                        department={{
                          id: dept.id,
                          name: dept.name,
                          caseCount: dept._count.cases,
                        }}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
}
