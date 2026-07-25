import { apiFetchFromServer } from '@/lib/api/server/apiFetch';
import { DEFAULT_PAGE_SIZE } from '@/constants/common';

import { PaginatedSchedules } from '@/lib/api/types';
import { SchedulesFilter } from '@/features/schedules/api/types';

export const getSchedulesFromServer = (
  page: number | string,
  filter: SchedulesFilter = {},
) =>
  apiFetchFromServer<PaginatedSchedules>('/schedules', {
    params: {
      page,
      limit: DEFAULT_PAGE_SIZE,
      ...(filter.status ? { status: filter.status } : {}),
      ...(filter.mine ? { mine: filter.mine } : {}),
    },
  });
