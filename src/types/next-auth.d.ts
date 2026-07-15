import type { Role } from "@prisma/client";
import type { DefaultSession } from "next-auth";

// Augment Auth.js types so `session.user.role` etc. are strongly typed.
declare module "next-auth" {
  interface User {
    role: Role;
    departmentId: string | null;
    tokenVersion?: number;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
      departmentId: string | null;
      tokenVersion: number;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: Role;
    departmentId: string | null;
    tokenVersion: number;
  }
}
