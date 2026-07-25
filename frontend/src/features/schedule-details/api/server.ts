import { apiFetchFromServer } from '@/lib/api/server/apiFetch';
import { Schedule } from '@/lib/api/types';

export const getScheduleFromServer = (id: string) =>
  apiFetchFromServer<Schedule>(`/schedules/${id}`);
