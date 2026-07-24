import 'client-only';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiFetchFromClient } from '@/lib/api/client';
import { DEFAULT_PAGE_SIZE } from '@/constants/common';
import { PaginatedSchedules } from '@/lib/api/type-aliases';

export const schedulesQueryKey = (page: number) =>
  ['schedules', { page }] as const;

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
