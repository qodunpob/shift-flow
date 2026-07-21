import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { DEFAULT_ROUTE, routes } from "@/routes";

const AUTH_COOKIE = "access_token";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthenticated = Boolean(request.cookies.get(AUTH_COOKIE)?.value);
  const isLoginRoute = pathname === routes.login;

  if (!isAuthenticated && !isLoginRoute) {
    return NextResponse.redirect(new URL(routes.login, request.url));
  }

  if (isAuthenticated && isLoginRoute) {
    return NextResponse.redirect(new URL(DEFAULT_ROUTE, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
