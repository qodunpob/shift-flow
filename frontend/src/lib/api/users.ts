import { apiFetchFromServer } from '@/lib/api/server';
import { CurrentUser } from '@/lib/api/type-aliases';

export const getCurrentUserFromServer = () =>
  apiFetchFromServer<CurrentUser>('/users/me');
