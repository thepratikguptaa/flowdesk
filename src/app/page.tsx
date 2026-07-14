import Link from "next/link";
import { ArrowRight, ShieldCheck, GitBranch, BarChart3 } from "lucide-react";

import { getCurrentUser } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layout/footer";

const FEATURES = [
  { icon: GitBranch, title: "Structured workflow", text: "Every case moves through a clear lifecycle — submitted to resolved." },
  { icon: ShieldCheck, title: "Role-based access", text: "Citizens, staff, managers, and admins each see exactly what they should." },
  { icon: BarChart3, title: "Full auditability", text: "Timelines and audit logs record who did what, and when." },
];

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex h-16 items-center justify-between px-6 md:px-10">
        <span className="font-heading text-lg font-semibold tracking-tight">FlowDesk</span>
        <div className="flex items-center gap-2">
          {user ? (
            <Button size="sm" render={<Link href="/dashboard" />}>
              Go to dashboard
            </Button>
          ) : (
            <>
              <Button variant="ghost" size="sm" render={<Link href="/login" />}>
                Sign in
              </Button>
              <Button size="sm" render={<Link href="/register" />}>
                Get started
              </Button>
            </>
          )}
        </div>
      </header>

      <main className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          Internal case management
        </span>
        <h1 className="mt-4 max-w-3xl font-heading text-4xl font-semibold tracking-tight sm:text-5xl">
          Every request. Every action. Every decision. Tracked.
        </h1>
        <p className="mt-5 max-w-xl text-balance text-muted-foreground">
          FlowDesk centralizes internal requests — complaints, support, approvals —
          into one accountable workflow with roles, timelines, and audit logs.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          {user ? (
            <Button render={<Link href="/dashboard" />}>
              Go to dashboard
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <>
              <Button render={<Link href="/register" />}>
                Get started
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" render={<Link href="/login" />}>
                Sign in
              </Button>
            </>
          )}
        </div>

        <div className="mt-16 grid max-w-4xl gap-6 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-sm border bg-card p-5 text-left">
              <f.icon className="h-5 w-5 text-primary" />
              <h2 className="mt-3 font-medium">{f.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
