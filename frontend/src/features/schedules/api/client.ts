import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiFetchFromClient } from '@/lib/api/client/apiFetch';
import { DEFAULT_PAGE_SIZE } from '@/constants/common';

import { PaginatedSchedules } from '@/lib/api/types';
import { SchedulesFilter } from '@/features/schedules/api/types';

export const schedulesQueryPrefix = ['schedules'] as const;

export const schedulesQueryKey = (page: number, filter: SchedulesFilter = {}) =>
  [...schedulesQueryPrefix, { page, ...filter }] as const;

export const useSchedulesQuery = (
  page: number,
  filter: SchedulesFilter = {},
  initialData?: PaginatedSchedules,
) =>
  useQuery({
    queryKey: schedulesQueryKey(page, filter),
    queryFn: () =>
      apiFetchFromClient<PaginatedSchedules>('/schedules', {
        params: {
          page,
          limit: DEFAULT_PAGE_SIZE,
          ...(filter.status ? { status: filter.status } : {}),
          ...(filter.mine ? { mine: filter.mine } : {}),
        },
      }),
    initialData,
    placeholderData: keepPreviousData,
  });
