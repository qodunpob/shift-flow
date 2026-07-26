import { apiFetchFromServer } from '@/lib/api/server/apiFetch';

import { CurrentUser } from '@/lib/api/types';

export const getCurrentUserFromServer = () =>
  apiFetchFromServer<CurrentUser>('/users/me');
