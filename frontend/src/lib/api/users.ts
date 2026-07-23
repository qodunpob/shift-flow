import { apiFetchFromServer } from '@/lib/api/server';

export interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export const getCurrentUserFromServer = () =>
  apiFetchFromServer<CurrentUser>('/users/me');
