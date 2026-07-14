"use client";

import { useState, useTransition } from "react";
import { KeyRound, Pencil, UserCheck, UserX } from "lucide-react";
import { toast } from "sonner";
import type { Role } from "@prisma/client";

import {
  resetUserPassword,
  setUserActive,
  type ActionState,
} from "@/lib/actions/users";
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
import { UserFormDialog } from "./user-form-dialog";

type Department = { id: string; name: string };

type RowUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId: string | null;
  isActive: boolean;
};

export function UserRowActions({
  user,
  departments,
  isSelf,
}: {
  user: RowUser;
  departments: Department[];
  isSelf: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-1">
      <UserFormDialog
        user={user}
        departments={departments}
        trigger={
          <Button variant="ghost" size="icon" aria-label={`Edit ${user.name}`}>
            <Pencil className="h-4 w-4 text-muted-foreground" />
          </Button>
        }
      />
      <ResetPasswordDialog user={user} />
      <StatusDialog user={user} isSelf={isSelf} />
    </div>
  );
}

function ResetPasswordDialog({ user }: { user: RowUser }) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<ActionState>({});
  const [pending, startTransition] = useTransition();

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await resetUserPassword({}, formData);
      if (res.ok) {
        setState({});
        setOpen(false);
        toast.success("Password reset");
      } else {
        setState(res);
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
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Reset password for ${user.name}`}
          />
        }
      >
        <KeyRound className="h-4 w-4 text-muted-foreground" />
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <form action={onSubmit} className="space-y-4">
          <DialogHeader>
            <DialogTitle>Reset password</DialogTitle>
            <DialogDescription>
              Set a new password for <strong>{user.name}</strong> and share it with
              them securely.
            </DialogDescription>
          </DialogHeader>

          <input type="hidden" name="id" value={user.id} />

          <div className="space-y-1.5">
            <Label htmlFor={`pw-${user.id}`}>New password</Label>
            <Input
              id={`pw-${user.id}`}
              name="password"
              type="text"
              placeholder="At least 8 characters"
              required
              autoFocus
            />
            {state.fieldErrors?.password && (
              <p className="text-xs text-destructive">
                {state.fieldErrors.password[0]}
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
              {pending ? "Saving…" : "Reset password"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StatusDialog({ user, isSelf }: { user: RowUser; isSelf: boolean }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const deactivating = user.isActive;

  function onSubmit(formData: FormData) {
    startTransition(async () => {
      const res = await setUserActive({}, formData);
      if (res.ok) {
        setOpen(false);
        toast.success(deactivating ? "User deactivated" : "User reactivated");
      } else if (res.error) {
        toast.error(res.error);
      }
    });
  }

  if (isSelf) {
    return (
      <Button
        variant="ghost"
        size="icon"
        disabled
        aria-label="You can't deactivate your own account"
        title="You can't deactivate your own account"
      >
        <UserX className="h-4 w-4 text-muted-foreground/40" />
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`${deactivating ? "Deactivate" : "Reactivate"} ${user.name}`}
          />
        }
      >
        {deactivating ? (
          <UserX className="h-4 w-4 text-muted-foreground" />
        ) : (
          <UserCheck className="h-4 w-4 text-emerald-600" />
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{deactivating ? "Deactivate user" : "Reactivate user"}</DialogTitle>
          <DialogDescription>
            {deactivating ? (
              <>
                This blocks <strong>{user.name}</strong> from signing in. Their cases
                and history are preserved, and you can reactivate them anytime.
              </>
            ) : (
              <>
                This restores sign-in access for <strong>{user.name}</strong>.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <form action={onSubmit}>
          <input type="hidden" name="id" value={user.id} />
          <input type="hidden" name="active" value={deactivating ? "false" : "true"} />
          <DialogFooter>
            <DialogClose render={<Button type="button" variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              type="submit"
              variant={deactivating ? "destructive" : "default"}
              disabled={pending}
            >
              {pending ? "Saving…" : deactivating ? "Deactivate" : "Reactivate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
