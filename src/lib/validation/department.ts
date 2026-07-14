import { z } from "zod";

export const departmentSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(60, "Name is too long"),
  description: z
    .string()
    .trim()
    .max(300, "Description is too long")
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

export type DepartmentInput = z.infer<typeof departmentSchema>;
