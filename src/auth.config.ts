import type { NextAuthConfig } from "next-auth";
import type { Role } from "@prisma/client";

/**
 * Edge-safe auth configuration.
 *
 * This half contains NO database or Node-only dependencies (bcrypt, Prisma) so
 * it can run in the middleware/edge runtime. The Credentials provider and its
 * DB lookup live in `auth.ts`, which runs in the Node runtime.
 */
export const authConfig = {
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [], // real providers are attached in auth.ts
  callbacks: {
    // Persist identity + role into the JWT on sign-in, then expose on session.
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = user.role;
        token.departmentId = user.departmentId ?? null;
        token.name = user.name;
        token.tokenVersion = user.tokenVersion ?? 0;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.departmentId = token.departmentId as string | null;
        // `?? 0` keeps sessions minted before this field existed valid.
        session.user.tokenVersion = (token.tokenVersion as number | undefined) ?? 0;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
