import { cookies } from 'next/headers'
import { AUTH_COOKIE } from '@/lib/session'

export interface ApiFetchInit extends RequestInit {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: Record<string, any>;
}

export const apiFetch = async <T>(path: string, { params, ...init }: ApiFetchInit = {}): Promise<T> =>  {
  const token = (await cookies()).get(AUTH_COOKIE)?.value;

  const headers = new Headers(init.headers);
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (init.body) {
    headers.set("Content-Type", "application/json");
  }
  const url = combineUrl(`${process.env.API_URL}${path}`, params);
  const response = await fetch(url, { ...init, headers }); 
  return response.json();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const combineUrl = (url: string, params: Record<string, any> = {}): string => {
  const searchParams = new URLSearchParams(params);
  if (searchParams.size > 0) {
    return url.indexOf('?') > -1 ? `${url}&${searchParams.toString()}` : `${url}?${searchParams.toString()}`;
  }
  return url;
}
