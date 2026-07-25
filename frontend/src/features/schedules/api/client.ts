import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { apiFetchFromClient } from '@/lib/api/client/apiFetch';
import { DEFAULT_PAGE_SIZE } from '@/constants/common';

import { CreatedSchedule, PaginatedSchedules } from '@/lib/api/types';
import { SchedulesFilter } from '@/features/schedules/api/types';
import { ApiError } from '@/lib/errors/ApiError';

export const schedulesQueryPrefix = ['schedules'] as const;

export const schedulesQueryFilter = {
  queryKey: schedulesQueryPrefix,
} as const;

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

export interface CreateScheduleInput {
  label?: string;
  startsAt: Date;
  endsAt: Date;
  timeZone: string;
}

export const useCreateScheduleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<CreatedSchedule, ApiError, CreateScheduleInput>({
    mutationFn: (input) =>
      apiFetchFromClient('/schedules', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSettled: () => queryClient.invalidateQueries(schedulesQueryFilter),
  });
};
