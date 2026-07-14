"use client";

import { useState, useTransition, type ReactElement } from "react";
import { toast } from "sonner";
import type { Role } from "@prisma/client";

import { createUser, updateUser, type ActionState } from "@/lib/actions/users";
import { ROLES, ROLE_META, ROLE_NEEDS_DEPARTMENT } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Department = { id: string; name: string };

export type UserFormValues = {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId: string | null;
};

function Err({ msg }: { msg?: string[] }) {
  if (!msg?.length) return null;
  return <p className="text-xs text-destructive">{msg[0]}</p>;
}

export function UserFormDialog({
  user,
  departments,
  trigger,
}: {
  user?: UserFormValues;
  departments: Department[];
  trigger: ReactElement;
}) {
  const editing = Boolean(user);
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ActionState>({});
  const [pending, startTransition] = useTransition();

  const [role, setRole] = useState<Role>(user?.role ?? "CITIZEN");
  const [departmentId, setDepartmentId] = useState<string>(user?.departmentId ?? "");

  const needsDept = ROLE_NEEDS_DEPARTMENT[role];
  const roleItems = Object.fromEntries(ROLES.map((r) => [r, ROLE_META[r].label]));
  const departmentItems = Object.fromEntries(departments.map((d) => [d.id, d.name]));

  function reset() {
    setState({});
    setRole(user?.role ?? "CITIZEN");
    setDepartmentId(user?.departmentId ?? "");
  }

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const action = editing ? updateUser : createUser;
      const result = await action({}, formData);
      if (result.ok) {
        setOpen(false);
        toast.success(editing ? "User updated" : "User created");
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
        if (!next) reset();
      }}
    >
      <DialogTrigger render={trigger} />
      <DialogContent className="sm:max-w-md">
        <form action={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit user" : "New user"}</DialogTitle>
            <DialogDescription>
              {editing
                ? "Update this person's details, role, or department."
                : "Create an account and assign its role. Elevated roles can only be granted here."}
            </DialogDescription>
          </DialogHeader>

          {editing && <input type="hidden" name="id" value={user!.id} />}

          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input
              id="name"
              name="name"
              defaultValue={user?.name}
              placeholder="e.g. Jordan Lee"
              required
              autoFocus
            />
            <Err msg={state.fieldErrors?.name} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              defaultValue={user?.email}
              placeholder="jordan@flowdesk.dev"
              required
            />
            <Err msg={state.fieldErrors?.email} />
          </div>

          {!editing && (
            <div className="space-y-1.5">
              <Label htmlFor="password">Temporary password</Label>
              <Input
                id="password"
                name="password"
                type="text"
                placeholder="At least 8 characters"
                required
              />
              <Err msg={state.fieldErrors?.password} />
              <p className="text-xs text-muted-foreground">
                Share this with the user so they can sign in. You can reset it later.
              </p>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                name="role"
                value={role}
                items={roleItems}
                onValueChange={(v) => setRole((v as Role) ?? "CITIZEN")}
              >
                <SelectTrigger className="w-full" aria-label="Role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => (
                    <SelectItem key={r} value={r}>
                      {ROLE_META[r].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Err msg={state.fieldErrors?.role} />
            </div>

            {needsDept && (
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Select
                  name="departmentId"
                  value={departmentId}
                  items={departmentItems}
                  onValueChange={(v) => setDepartmentId(v ?? "")}
                >
                  <SelectTrigger className="w-full" aria-label="Department">
                    <SelectValue placeholder="Choose a department" />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Err msg={state.fieldErrors?.departmentId} />
              </div>
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
              {pending ? "Saving…" : editing ? "Save changes" : "Create user"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
