import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "@/i18n/routing";
import { DEFAULT_ROUTE, routes } from "@/routes";

const AUTH_COOKIE = "access_token";
const handleIntl = createIntlMiddleware(routing);

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

  return handleIntl(request);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
