"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** Top-bar link that points to the opposite auth action from the current page. */
export function AuthNavLink() {
  const pathname = usePathname();
  const onRegister = pathname?.startsWith("/register");

  return onRegister ? (
    <Link
      href="/login"
      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      Sign in
    </Link>
  ) : (
    <Link
      href="/register"
      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      Create account
    </Link>
  );
}
