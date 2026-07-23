import { apiFetchFromServer } from '@/lib/api/server';
import type { components } from '@/lib/api/schema';

export type CurrentUser = components['schemas']['UserResponseDto'];

export const getCurrentUserFromServer = () =>
  apiFetchFromServer<CurrentUser>('/users/me');
