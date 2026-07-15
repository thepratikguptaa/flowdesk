import type { ReactNode } from "react";
import Link from "next/link";

import { AuthNavLink } from "@/components/auth/auth-nav-link";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-muted/20">
      {/* Slim top bar with the wordmark + the opposite auth action */}
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          <Link href="/" className="font-heading text-lg font-semibold tracking-tight">
            FlowDesk
          </Link>
          <AuthNavLink />
        </div>
      </header>

      {/* Centered form card */}
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm">
          {children}
        </div>
      </main>
    </div>
  );
}
