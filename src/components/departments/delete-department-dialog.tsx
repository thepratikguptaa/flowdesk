"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteDepartment } from "@/lib/actions/departments";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function DeleteDepartmentDialog({
  department,
}: {
  department: { id: string; name: string; caseCount: number };
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await deleteDepartment({}, formData);
      if (result.ok) {
        setOpen(false);
        toast.success("Department deleted");
      } else if (result.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="ghost" size="icon" aria-label={`Delete ${department.name}`} />
        }
      >
        <Trash2 className="h-4 w-4 text-muted-foreground" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete department</DialogTitle>
          <DialogDescription>
            This permanently removes <strong>{department.name}</strong>. Staff in
            this department will be unassigned. This cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {department.caseCount > 0 && (
          <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:bg-amber-950/40 dark:text-amber-300">
            This department has {department.caseCount} case(s) and can’t be deleted
            until they’re reassigned or closed.
          </p>
        )}

        <form action={onSubmit}>
          <input type="hidden" name="id" value={department.id} />
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" variant="destructive" disabled={pending}>
              {pending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
