import { apiFetchFromServer } from '@/lib/api/server/apiFetch';
import { DEFAULT_PAGE_SIZE } from '@/constants/common';

import { PaginatedSchedules } from '@/lib/api/types';

export const getSchedulesFromServer = (page: number | string) =>
  apiFetchFromServer<PaginatedSchedules>('/schedules', {
    params: { page, limit: DEFAULT_PAGE_SIZE },
  });
