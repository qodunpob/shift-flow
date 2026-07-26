import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { DEFAULT_ROUTE, routes } from '@/routes';
import { AUTH_COOKIE } from '@/lib/session';

const handleIntl = createIntlMiddleware(routing);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(AUTH_COOKIE)?.value;

  if (pathname.startsWith('/api/')) {
    if (!token) {
      return NextResponse.next();
    }

    const headers = new Headers(request.headers);
    headers.set('Authorization', `Bearer ${token}`);
    return NextResponse.next({ request: { headers } });
  }

  const isAuthenticated = Boolean(token);
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
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
