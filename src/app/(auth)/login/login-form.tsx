"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEMO_ACCOUNTS = [
  { label: "Admin", email: "admin@flowdesk.dev" },
  { label: "Manager (IT)", email: "manager.it@flowdesk.dev" },
  { label: "Staff (IT)", email: "staff.it@flowdesk.dev" },
  { label: "Citizen", email: "citizen@flowdesk.dev" },
];
const DEMO_PASSWORD = "Password123!";
const demoItems = Object.fromEntries(DEMO_ACCOUNTS.map((a) => [a.email, a.label]));

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

      {/* Demo accounts — pick a role to sign in instantly (handy for reviewers). */}
      <div className="mt-8 border-t pt-6">
        <Label
          htmlFor="demo-role"
          className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
        >
          Or explore a demo role
        </Label>
        <Select
          items={demoItems}
          disabled={pending}
          onValueChange={(value) => {
            if (value) signInAsDemo(String(value));
          }}
        >
          <SelectTrigger
            id="demo-role"
            className="mt-2 w-full"
            aria-label="Sign in as a demo role"
          >
            <SelectValue placeholder="Sign in as…" />
          </SelectTrigger>
          <SelectContent>
            {DEMO_ACCOUNTS.map((acct) => (
              <SelectItem key={acct.email} value={acct.email}>
                {acct.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {demoLoading && (
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            Signing in…
          </p>
        )}
      </div>
    </div>
  );
}
