import { apiFetch } from '@/lib/api/apiFetch'

export interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  roles: string[];
}

export const getCurrentUser = () => apiFetch<CurrentUser>('/users/me');
