import { apiFetchFromServer } from '@/lib/api/server/apiFetch';
import { Schedule, Shift } from '@/lib/api/types';

export const getScheduleFromServer = (id: string) =>
  apiFetchFromServer<Schedule>(`/schedules/${id}`);

export const getShiftsFromServer = (scheduleId: string) =>
  apiFetchFromServer<Shift[]>(`/schedules/${scheduleId}/shifts`);
