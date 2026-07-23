import { apiFetchFromServer } from '@/lib/api/server';
import { DEFAULT_PAGE_SIZE } from '@/constants/common';
import { PaginatedSchedules } from '@/lib/api/type-aliases';

export const getSchedulesFromServer = (page: number | string) =>
  apiFetchFromServer<PaginatedSchedules>('/schedules', {
    params: { page, limit: DEFAULT_PAGE_SIZE },
  });
