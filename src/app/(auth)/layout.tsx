import Link from "next/link";
import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-slate-50 dark:bg-slate-950">
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="mb-8 flex items-center justify-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-900 font-bold text-white dark:bg-white dark:text-slate-900">
              F
            </span>
            <span className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
              FlowDesk
            </span>
          </Link>
          {children}
        </div>
      </main>
    </div>
  );
}
