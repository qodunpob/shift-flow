import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { AUTH_COOKIE } from '@/lib/session';
import { routes } from '@/routes';
import { StatusCodes } from 'http-status-codes';
import { combineUrl } from '@/utils/combineUrl';

export interface ApiFetchInit extends RequestInit {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: Record<string, any>;
}

export const apiFetchFromServer = async <Result>(
  path: string,
  { params, ...init }: ApiFetchInit = {},
): Promise<Result> => {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;

  const headers = new Headers(init.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (init.body) {
    headers.set('Content-Type', 'application/json');
  }
  const url = combineUrl(`${process.env.API_URL}${path}`, params);
  const response = await fetch(url, { ...init, headers });

  if (response.status === StatusCodes.UNAUTHORIZED) {
    redirect(routes.login);
  }

  return response.json();
};
