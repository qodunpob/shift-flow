import 'client-only';
import { routes } from '@/routes';
import { StatusCodes } from 'http-status-codes';
import { combineUrl } from '@/utils/combineUrl';
import { ApiFetchInit } from '@/lib/api/types';

export const apiFetchFromClient = async <Result>(
  path: string,
  { params, ...init }: ApiFetchInit = {},
): Promise<Result> => {
  const headers = new Headers(init.headers);
  if (init.body) {
    headers.set('Content-Type', 'application/json');
  }
  const url = combineUrl(`/api${path}`, params);
  const response = await fetch(url, { ...init, headers });

  if (response.status === StatusCodes.UNAUTHORIZED) {
    window.location.assign(routes.login);
    throw new Error('Session expired');
  }

  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}`);
  }

  return response.json();
};
