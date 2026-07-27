import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { apiFetchFromClient } from '@/lib/api/client/apiFetch';
import { DEFAULT_PAGE_SIZE } from '@/constants/common';

import {
  CreatedSchedule,
  PaginatedSchedules,
  UnavailableDates,
} from '@/lib/api/types';
import { SchedulesFilter } from '@/features/schedules/api/types';

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

export const unavailableDatesQueryKey = (excludeId?: string) =>
  [...schedulesQueryPrefix, 'unavailable-dates', { excludeId }] as const;

// Gated by `enabled` since this is only needed while a schedule form's date
// picker is actually open - it shares the "schedules" query key prefix so a
// create/update/delete elsewhere invalidates it along with everything else.
// `excludeId` (the schedule being edited, if any) is resolved server-side so
// the response never has to carry other schedules' ids to the client.
export const useUnavailableDatesQuery = (
  enabled: boolean,
  excludeId?: string,
) =>
  useQuery({
    queryKey: unavailableDatesQueryKey(excludeId),
    queryFn: () =>
      apiFetchFromClient<UnavailableDates[]>('/schedules/unavailable-dates', {
        params: excludeId ? { excludeId } : undefined,
      }),
    enabled,
  });

export interface CreateScheduleInput {
  label?: string;
  startsAt: Date;
  endsAt: Date;
  timeZone: string;
}

export const useCreateScheduleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<CreatedSchedule, Error, CreateScheduleInput>({
    mutationFn: (input) =>
      apiFetchFromClient('/schedules', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSettled: () => queryClient.invalidateQueries(schedulesQueryFilter),
  });
};

export interface UpdateScheduleInput {
  id: string;
  label?: string;
  startsAt: Date;
  endsAt: Date;
  timeZone: string;
}

export const useUpdateScheduleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<CreatedSchedule, Error, UpdateScheduleInput>({
    mutationFn: ({ id, ...input }) =>
      apiFetchFromClient(`/schedules/${id}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
    onSettled: () => queryClient.invalidateQueries(schedulesQueryFilter),
  });
};

export const useDeleteScheduleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, string>({
    mutationFn: (id) =>
      apiFetchFromClient(`/schedules/${id}`, { method: 'DELETE' }),
    onSettled: () => queryClient.invalidateQueries(schedulesQueryFilter),
  });
};
