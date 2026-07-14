"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@flowdesk.dev" },
  { label: "Manager (IT)", email: "manager.it@flowdesk.dev" },
  { label: "Staff (IT)", email: "staff.it@flowdesk.dev" },
  { label: "Citizen", email: "citizen@flowdesk.dev" },
];
const DEMO_PASSWORD = "Password123!";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function authenticate(emailValue: string, passwordValue: string) {
    setError(null);
    startTransition(async () => {
      const res = await signIn("credentials", {
        email: emailValue,
        password: passwordValue,
        redirect: false,
      });
      if (!res || res.error) {
        setError("Invalid email or password.");
        setDemoLoading(null);
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    });
  }

  function signInAsDemo(demoEmail: string) {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setDemoLoading(demoEmail);
    authenticate(demoEmail, DEMO_PASSWORD);
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter your credentials to continue.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          authenticate(email, password);
        }}
        className="space-y-4"
      >
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <p role="alert" className="rounded-sm bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <Button type="submit" disabled={pending} className="w-full">
          {pending && !demoLoading ? "Signing in…" : "Sign in"}
        </Button>
      </form>

      {/* Demo accounts — click to sign in instantly (handy for reviewers). */}
      <div className="mt-8 border-t pt-6">
        <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Demo accounts
        </p>
        <div className="grid grid-cols-2 gap-2">
          {DEMO_ACCOUNTS.map((acct) => (
            <button
              key={acct.email}
              type="button"
              disabled={pending}
              onClick={() => signInAsDemo(acct.email)}
              className="relative cursor-pointer rounded-sm border p-2.5 text-left transition-colors hover:border-primary hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            >
              <span className="flex items-center gap-1.5 text-sm font-medium">
                {demoLoading === acct.email && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                {acct.label}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {acct.email}
              </span>
            </button>
          ))}
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-muted-foreground">
        No account?{" "}
        <Link href="/register" className="font-medium text-primary underline-offset-4 hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
