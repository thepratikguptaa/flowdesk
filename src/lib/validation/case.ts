import { z } from "zod";

import { CASE_CATEGORIES } from "@/lib/constants";

const priorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

// Today's date as an ISO yyyy-mm-dd string (used to reject past due dates).
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

const notPast = (v?: string) => !v || v >= todayISO();
const isValidDate = (d: Date | null | undefined) =>
  d === undefined || d === null || !Number.isNaN(d.getTime());

export const createCaseSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Give the case a clear title (at least 5 characters)")
    .max(140, "Title is too long"),
  description: z
    .string()
    .trim()
    .min(10, "Please describe the issue in a little more detail")
    .max(5000, "Description is too long"),
  category: z.enum(CASE_CATEGORIES),
  priority: priorityEnum.default("MEDIUM"),
  departmentId: z.string().min(1, "Choose a department"),
  dueDate: z
    .string()
    .optional()
    .refine(notPast, "Due date can't be in the past")
    .transform((v) => (v ? new Date(v) : undefined))
    .refine(isValidDate, "Invalid date"),
});

export const updateCaseSchema = z.object({
  title: z.string().trim().min(5).max(140),
  description: z.string().trim().min(10).max(5000),
  category: z.enum(CASE_CATEGORIES),
  priority: priorityEnum,
  departmentId: z.string().min(1),
  dueDate: z
    .string()
    .optional()
    .refine(notPast, "Due date can't be in the past")
    .transform((v) => (v ? new Date(v) : null))
    .refine(isValidDate, "Invalid date"),
});

export type CreateCaseInput = z.infer<typeof createCaseSchema>;
export type UpdateCaseInput = z.infer<typeof updateCaseSchema>;
