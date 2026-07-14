import { Prisma } from "@prisma/client";

/**
 * Shared result shape for form-driven server actions. Actions return `ok` on
 * success, a top-level `error` for general failures, or per-field `fieldErrors`
 * from Zod validation.
 */
export type FormState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

/** True when a Prisma write failed a unique constraint (duplicate key, P2002). */
export function isUniqueConstraintError(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002"
  );
}
