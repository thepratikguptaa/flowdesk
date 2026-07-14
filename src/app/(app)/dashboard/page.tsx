import type { Metadata } from "next";

import { requireUser } from "@/lib/auth/session";
import { logoutAction } from "@/lib/actions/logout";

export const metadata: Metadata = { title: "Dashboard · FlowDesk" };

const ROLE_LABEL: Record<string, string> = {
  CITIZEN: "Citizen",
  STAFF: "Staff",
  MANAGER: "Department Manager",
  ADMIN: "Administrator",
};

export default async function DashboardPage() {
  const user = await requireUser();

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">Signed in as</p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">
          {user.name}
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>

        <span className="mt-4 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300">
          {ROLE_LABEL[user.role] ?? user.role}
        </span>

        <div className="mt-8 rounded-lg border border-dashed border-slate-300 p-6 text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
          Phase 1 foundation is live: authentication, sessions, and RBAC are
          wired up. Cases, departments, and analytics arrive in the next phases.
        </div>

        <form action={logoutAction} className="mt-8">
          <button
            type="submit"
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            Sign out
          </button>
        </form>
      </div>
    </div>
  );
}
