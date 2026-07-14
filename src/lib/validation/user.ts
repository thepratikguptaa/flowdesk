import { z } from "zod";
import type { Role } from "@prisma/client";

const ROLE_VALUES = ["CITIZEN", "STAFF", "MANAGER", "ADMIN"] as const satisfies readonly Role[];

const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password is too long");

const baseUser = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80, "Name is too long"),
  email: z.string().trim().toLowerCase().email("Enter a valid email address"),
  role: z.enum(ROLE_VALUES),
  // Empty string (no selection) collapses to undefined; department is optional
  // at the type level and required for STAFF/MANAGER by the refinement below.
  departmentId: z
    .string()
    .trim()
    .optional()
    .or(z.literal("").transform(() => undefined)),
});

/** Staff and managers must belong to a department; citizens/admins never do. */
function requireDepartmentForStaff(
  data: { role: Role; departmentId?: string },
  ctx: z.RefinementCtx,
) {
  if ((data.role === "STAFF" || data.role === "MANAGER") && !data.departmentId) {
    ctx.addIssue({
      code: "custom",
      path: ["departmentId"],
      message: "Staff and managers must belong to a department",
    });
  }
}

export const createUserSchema = baseUser
  .extend({ password: passwordField })
  .superRefine(requireDepartmentForStaff);

export const updateUserSchema = baseUser.superRefine(requireDepartmentForStaff);

export const resetPasswordSchema = z.object({ password: passwordField });

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
