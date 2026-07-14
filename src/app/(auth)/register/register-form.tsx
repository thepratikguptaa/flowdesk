"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { registerUser, type RegisterState } from "@/lib/actions/auth";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="text-xs text-red-600 dark:text-red-400">{errors[0]}</p>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 flex w-full items-center justify-center rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
    >
      {pending ? "Creating account…" : "Create account"}
    </button>
  );
}

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white";
const labelClass = "text-sm font-medium text-slate-700 dark:text-slate-300";

export function RegisterForm() {
  const [state, formAction] = useActionState<RegisterState, FormData>(registerUser, {});
  const router = useRouter();

  useEffect(() => {
    if (state.success) {
      router.push("/login?registered=1");
    }
  }, [state.success, router]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
          Create your account
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Start submitting and tracking cases.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="name" className={labelClass}>Full name</label>
          <input id="name" name="name" type="text" autoComplete="name" required className={inputClass} placeholder="Jane Doe" />
          <FieldError errors={state.fieldErrors?.name} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="email" className={labelClass}>Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} placeholder="you@example.com" />
          <FieldError errors={state.fieldErrors?.email} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className={labelClass}>Password</label>
          <input id="password" name="password" type="password" autoComplete="new-password" required className={inputClass} placeholder="At least 8 characters" />
          <FieldError errors={state.fieldErrors?.password} />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className={labelClass}>Confirm password</label>
          <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" required className={inputClass} placeholder="Re-enter password" />
          <FieldError errors={state.fieldErrors?.confirmPassword} />
        </div>

        {state.error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {state.error}
          </p>
        )}

        <SubmitButton />
      </form>

      <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-slate-900 underline-offset-4 hover:underline dark:text-white">
          Sign in
        </Link>
      </p>
    </div>
  );
}
