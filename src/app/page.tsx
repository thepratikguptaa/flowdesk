import { Fragment } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Clock,
  BarChart3,
  Workflow,
  Users,
  Wrench,
  CreditCard,
  Wifi,
  BookOpen,
  type LucideIcon,
} from "lucide-react";

import { getCurrentUser } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layout/footer";

const HERO_BADGES: { icon: LucideIcon; label: string }[] = [
  { icon: ShieldCheck, label: "Secure & role-based" },
  { icon: Clock, label: "Real-time tracking" },
  { icon: BarChart3, label: "Reports & analytics" },
];

const TONES: Record<string, string> = {
  amber: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  green: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

const SAMPLE_REQUESTS: {
  icon: LucideIcon;
  title: string;
  status: string;
  tone: keyof typeof TONES;
}[] = [
  { icon: Wrench, title: "Hostel room maintenance", status: "In Progress", tone: "amber" },
  { icon: CreditCard, title: "ID card request", status: "Submitted", tone: "blue" },
  { icon: Wifi, title: "Wi-Fi not working", status: "In Progress", tone: "amber" },
  { icon: BookOpen, title: "Library book issue", status: "Resolved", tone: "green" },
];

const FEATURES: { icon: LucideIcon; title: string; text: string }[] = [
  {
    icon: Workflow,
    title: "Structured Workflows",
    text: "Every request follows a clear process from submission to resolution.",
  },
  {
    icon: Users,
    title: "Role-Based Access",
    text: "Citizens, staff, managers, and admins see what they need — nothing more.",
  },
  {
    icon: Clock,
    title: "Real-Time Updates",
    text: "Track progress in real time and stay informed at every step.",
  },
  {
    icon: ShieldCheck,
    title: "Audit & Transparency",
    text: "Timelines and audit logs keep every action accountable.",
  },
];

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-primary">
      {children}
    </p>
  );
}

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="font-heading text-lg font-semibold tracking-tight">
            FlowDesk
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <Button size="sm" render={<Link href="/dashboard" />}>
                Go to dashboard
              </Button>
            ) : (
              <>
                <Button size="sm" render={<Link href="/register" />}>
                  Get started
                </Button>
                <Button variant="ghost" size="sm" render={<Link href="/login" />}>
                  Sign in
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-6 pb-16 pt-20 text-center">
          <h1 className="mx-auto max-w-3xl font-heading text-4xl font-semibold leading-[1.05] tracking-tight sm:text-6xl">
            Simplify requests.
            <br />
            Streamline work.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-balance text-muted-foreground">
            FlowDesk helps teams and organizations manage requests, approvals, and
            tasks in one place with full visibility, accountability, and control.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {user ? (
              <Button render={<Link href="/dashboard" />}>
                Go to dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button render={<Link href="/register" />}>Get started for free</Button>
                <Button variant="ghost" render={<Link href="/login" />}>
                  Book a demo
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>

          <div className="mx-auto mt-10 flex max-w-2xl flex-wrap items-center justify-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
            {HERO_BADGES.map((b, i) => (
              <Fragment key={b.label}>
                {i > 0 && <span className="hidden h-4 w-px bg-border sm:block" />}
                <span className="inline-flex items-center gap-2">
                  <b.icon className="h-4 w-4 text-primary" />
                  {b.label}
                </span>
              </Fragment>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="border-t bg-muted/20 py-20">
          <div className="mx-auto max-w-6xl px-6">
            <Eyebrow>Designed for better workflows</Eyebrow>
            <div className="mt-12 grid items-center gap-12 md:grid-cols-2">
              {/* Mock request card */}
              <div className="relative">
                <div
                  className="pointer-events-none absolute -left-4 -top-4 hidden h-20 w-20 text-border md:block"
                  style={{
                    backgroundImage: "radial-gradient(currentColor 1.5px, transparent 1.5px)",
                    backgroundSize: "11px 11px",
                  }}
                  aria-hidden
                />
                <div className="absolute inset-0 translate-x-3 translate-y-3 rounded-lg bg-primary/5" aria-hidden />
                <div className="relative rounded-lg border bg-card p-5 shadow-sm">
                  <p className="text-sm font-medium">My Requests</p>
                  <div className="mt-4 divide-y">
                    {SAMPLE_REQUESTS.map((r) => (
                      <div key={r.title} className="flex items-center gap-3 py-3">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
                          <r.icon className="h-4 w-4" />
                        </span>
                        <span className="flex-1 text-sm">{r.title}</span>
                        <span
                          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${TONES[r.tone]}`}
                        >
                          {r.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Feature list */}
              <div className="space-y-8">
                {FEATURES.map((f) => (
                  <div key={f.title} className="flex gap-4">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <f.icon className="h-5 w-5" />
                    </span>
                    <div>
                      <h3 className="font-heading font-semibold">{f.title}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

      </main>

      <div id="footer">
        <Footer />
      </div>
    </div>
  );
}
