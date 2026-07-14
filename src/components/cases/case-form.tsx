"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import type { Priority } from "@prisma/client";

import { createCase, updateCase, type CaseActionState } from "@/lib/actions/cases";
import { CASE_CATEGORIES, PRIORITIES, PRIORITY_META } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Department = { id: string; name: string };

export type CaseFormValues = {
  id?: string;
  title?: string;
  description?: string;
  category?: string;
  priority?: Priority;
  departmentId?: string;
  dueDate?: string; // yyyy-mm-dd
};

function Err({ msg }: { msg?: string[] }) {
  if (!msg?.length) return null;
  return <p className="text-xs text-destructive">{msg[0]}</p>;
}

function SubmitButton({ editing }: { editing: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Saving…" : editing ? "Save changes" : "Submit case"}
    </Button>
  );
}

export function CaseForm({
  mode,
  departments,
  values = {},
  canManageFields = true,
}: {
  mode: "create" | "edit";
  departments: Department[];
  values?: CaseFormValues;
  /** When false, priority/department/due-date are shown read-only (reporter edit). */
  canManageFields?: boolean;
}) {
  const editing = mode === "edit";
  const [state, formAction] = useActionState<CaseActionState, FormData>(
    editing ? updateCase : createCase,
    {},
  );

  // Base UI Select shows the raw value unless given an items map (value → label).
  const categoryItems = Object.fromEntries(CASE_CATEGORIES.map((c) => [c, c]));
  const priorityItems = Object.fromEntries(
    PRIORITIES.map((p) => [p, PRIORITY_META[p].label]),
  );
  const departmentItems = Object.fromEntries(departments.map((d) => [d.id, d.name]));

  // Min selectable due date = today (matches the server-side past-date check).
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={formAction} className="space-y-6">
      {editing && <input type="hidden" name="id" value={values.id} />}

      <div className="space-y-1.5">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          defaultValue={values.title}
          placeholder="Short summary of the request or issue"
          required
        />
        <Err msg={state.fieldErrors?.title} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={values.description}
          placeholder="Describe the situation, including any relevant details"
          rows={6}
          required
        />
        <Err msg={state.fieldErrors?.description} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select name="category" defaultValue={values.category} items={categoryItems} required>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a category" />
            </SelectTrigger>
            <SelectContent>
              {CASE_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Err msg={state.fieldErrors?.category} />
        </div>

        <div className="space-y-1.5">
          <Label>Department</Label>
          <Select
            name="departmentId"
            defaultValue={values.departmentId}
            items={departmentItems}
            disabled={!canManageFields}
            required
          >
            <SelectTrigger className="w-full">
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

        <div className="space-y-1.5">
          <Label>Priority</Label>
          <Select
            name="priority"
            defaultValue={values.priority ?? "MEDIUM"}
            items={priorityItems}
            disabled={!canManageFields}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {PRIORITY_META[p].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!canManageFields && (
            <p className="text-xs text-muted-foreground">
              Priority is set by the department team.
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="dueDate">Due date (optional)</Label>
          <Input
            id="dueDate"
            name="dueDate"
            type="date"
            min={today}
            defaultValue={values.dueDate}
            disabled={!canManageFields}
          />
        </div>
      </div>

      {mode === "create" && (
        <div className="space-y-1.5">
          <Label htmlFor="attachments">Images (optional)</Label>
          <Input
            id="attachments"
            name="attachments"
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            multiple
            className="file:mr-3 file:cursor-pointer file:rounded-sm file:border-0 file:bg-muted file:px-2 file:py-0.5 file:text-xs file:font-medium"
          />
          <Err msg={state.fieldErrors?.attachments} />
          <p className="text-xs text-muted-foreground">
            Attach screenshots or photos — PNG, JPG, GIF, or WebP, up to 10 MB each.
          </p>
        </div>
      )}

      {state.error && (
        <p role="alert" className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-2">
        <SubmitButton editing={editing} />
        <Button type="button" variant="outline" render={<Link href={editing && values.id ? `/cases/${values.id}` : "/cases"} />}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
