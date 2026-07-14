"use server";

import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import { isUniqueConstraintError } from "@/lib/actions/form-state";
import { registerSchema } from "@/lib/validation/auth";

export type RegisterState = {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
};

/**
 * Register a new CITIZEN account. Elevated roles (STAFF/MANAGER/ADMIN) are
 * granted only by an admin from the user-management screen, never self-service.
 */
export async function registerUser(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { name, email, password } = parsed.data;
  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await prisma.user.create({
      data: { name, email, passwordHash, role: "CITIZEN" },
    });
  } catch (err) {
    // Unique constraint on email → friendly message, no enumeration leak beyond
    // what a login attempt would already reveal.
    if (isUniqueConstraintError(err)) {
      return { error: "An account with that email already exists." };
    }
    return { error: "Something went wrong. Please try again." };
  }

  return { success: true };
}
