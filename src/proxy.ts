import { NextResponse, type NextRequest } from "next/server";

import { decryptSession, sessionCookieName } from "@/lib/session";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/predictions",
  "/leaderboard",
  "/todos",
  "/bracket",
  "/rules",
  "/profile",
  "/admin",
];
const AUTH_PREFIXES = ["/login", "/register", "/invite"];

function startsWithAny(pathname: string, prefixes: string[]): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname } = request.nextUrl;

  const isProtected = startsWithAny(pathname, PROTECTED_PREFIXES);
  const isAuthRoute = startsWithAny(pathname, AUTH_PREFIXES);

  if (!isProtected && !isAuthRoute) {
    return NextResponse.next();
  }

  const token = request.cookies.get(sessionCookieName)?.value;
  const session = await decryptSession(token);

  if (isProtected && !session?.userId) {
    const loginUrl = new URL("/login", request.nextUrl);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && session?.userId) {
    const dashboardUrl = new URL("/dashboard", request.nextUrl);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
