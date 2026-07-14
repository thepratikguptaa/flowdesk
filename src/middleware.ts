import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/auth.config";

// Edge-safe middleware: uses the DB-free auth config to read the JWT session.
const { auth } = NextAuth(authConfig);

const PUBLIC_ROUTES = ["/login", "/register"];
const AUTH_ROUTES = ["/login", "/register"];

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const path = nextUrl.pathname;

  const isAuthRoute = AUTH_ROUTES.includes(path);
  const isPublic = PUBLIC_ROUTES.includes(path);

  // Signed-in users shouldn't sit on the login/register screens.
  if (isAuthRoute && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", nextUrl));
  }

  // Everything non-public requires a session.
  if (!isPublic && !isLoggedIn) {
    const redirectUrl = new URL("/login", nextUrl);
    redirectUrl.searchParams.set("callbackUrl", path);
    return NextResponse.redirect(redirectUrl);
  }

  return NextResponse.next();
});

export const config = {
  // Run on all routes except Next internals, the auth API, and static assets.
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
