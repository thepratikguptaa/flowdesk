"use client";

import { useState, useTransition, type ReactElement } from "react";
import { toast } from "sonner";

import {
  createDepartment,
  updateDepartment,
  type ActionState,
} from "@/lib/actions/departments";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

type Department = { id: string; name: string; description: string | null };

export function DepartmentFormDialog({
  department,
  trigger,
}: {
  department?: Department;
  trigger: ReactElement;
}) {
  const editing = Boolean(department);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ActionState>({});
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const action = editing ? updateDepartment : createDepartment;
      const result = await action({}, formData);
      if (result.ok) {
        setState({});
        setOpen(false);
        toast.success(editing ? "Department updated" : "Department created");
      } else {
        setState(result);
      }
    });
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setState({});
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <form action={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit department" : "New department"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update the department name or description."
                : "Create a department that cases can be routed to."}
            </DialogDescription>
          </DialogHeader>

          {editing && <input type="hidden" name="id" value={department!.id} />}

          <div className="space-y-1.5">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={department?.name}
              placeholder="e.g. IT Support"
              required
              autoFocus
            />
            {state.fieldErrors?.name && (
              <p className="text-xs text-destructive">{state.fieldErrors.name[0]}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              defaultValue={department?.description ?? ""}
              placeholder="What this department handles"
              rows={3}
            />
            {state.fieldErrors?.description && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.description[0]}
              </p>
            )}
          </div>

          {state.error && (
            <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {state.error}
            </p>
          )}

          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : editing ? "Save changes" : "Create department"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
