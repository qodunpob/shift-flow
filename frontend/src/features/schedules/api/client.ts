import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiFetchFromClient } from '@/lib/api/client/apiFetch';
import { DEFAULT_PAGE_SIZE } from '@/constants/common';

import { PaginatedSchedules } from '@/lib/api/types';

export const schedulesQueryPrefix = ['schedules'] as const;

export const schedulesQueryKey = (page: number) =>
  [...schedulesQueryPrefix, { page }] as const;

export const useSchedulesQuery = (
  page: number,
  initialData?: PaginatedSchedules,
) =>
  useQuery({
    queryKey: schedulesQueryKey(page),
    queryFn: () =>
      apiFetchFromClient<PaginatedSchedules>('/schedules', {
        params: { page, limit: DEFAULT_PAGE_SIZE },
      }),
    initialData,
    placeholderData: keepPreviousData,
  });
