import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { DEFAULT_PAGE_SIZE } from '@/constants/common';
import {
  CreateScheduleInput,
  UpdateScheduleInput,
  schedulesQueryKey,
  useCreateScheduleMutation,
  useDeleteScheduleMutation,
  useSchedulesQuery,
  useUpdateScheduleMutation,
} from '@/features/schedules/api/client';
import { apiFetchFromClient } from '@/lib/api/client/apiFetch';
import { ApiError } from '@/lib/errors/ApiError';
import { PaginatedSchedules } from '@/lib/api/types';

jest.mock('@/lib/api/client/apiFetch', () => ({
  apiFetchFromClient: jest.fn(),
}));

const mockedApiFetchFromClient = apiFetchFromClient as jest.MockedFunction<
  typeof apiFetchFromClient
>;

const makeSchedules = (page: number): PaginatedSchedules => ({
  items: [],
  meta: { total: 0, page, limit: DEFAULT_PAGE_SIZE, totalPages: 1 },
});

const createWrapper = () => {
  // staleTime: Infinity matters for the "uses initialData" test below: with
  // the default staleTime of 0, TanStack Query treats seeded data as stale
  // immediately and fires a background refetch on mount regardless of
  // initialData, which would make that assertion flaky. It doesn't affect
  // the "no initialData" test, since a query with no cache entry always
  // fetches on mount no matter what staleTime is set to.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

describe('features/schedules/api/client', () => {
  const createWrapperWithClient = (queryClient: QueryClient) =>
    function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      );
    };

  beforeEach(() => {
    mockedApiFetchFromClient.mockReset();
  });

  it('should use initialData without calling apiFetchFromClient on first render', async () => {
    const initialData = makeSchedules(1);

    const { result } = renderHook(() => useSchedulesQuery(1, {}, initialData), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toEqual(initialData);
    expect(mockedApiFetchFromClient).not.toHaveBeenCalled();
  });

  it('should fetch fresh data when no initialData is provided for the page', async () => {
    const pageTwoData = makeSchedules(2);
    mockedApiFetchFromClient.mockResolvedValue(pageTwoData);

    const { result } = renderHook(() => useSchedulesQuery(2, {}), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toEqual(pageTwoData));

    expect(mockedApiFetchFromClient).toHaveBeenCalledWith('/schedules', {
      params: { page: 2, limit: DEFAULT_PAGE_SIZE },
    });
  });

  it('should include the status filter in the request params when provided', async () => {
    mockedApiFetchFromClient.mockResolvedValue(makeSchedules(1));

    renderHook(() => useSchedulesQuery(1, { status: 'APPROVED' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() =>
      expect(mockedApiFetchFromClient).toHaveBeenCalledWith('/schedules', {
        params: { page: 1, limit: DEFAULT_PAGE_SIZE, status: 'APPROVED' },
      }),
    );
  });

  it('should include the mine filter in the request params only when true', async () => {
    mockedApiFetchFromClient.mockResolvedValue(makeSchedules(1));

    renderHook(() => useSchedulesQuery(1, { mine: true }), {
      wrapper: createWrapper(),
    });

    await waitFor(() =>
      expect(mockedApiFetchFromClient).toHaveBeenCalledWith('/schedules', {
        params: { page: 1, limit: DEFAULT_PAGE_SIZE, mine: true },
      }),
    );
  });

  it('should omit status and mine from the request params when not provided', async () => {
    mockedApiFetchFromClient.mockResolvedValue(makeSchedules(1));

    renderHook(() => useSchedulesQuery(1, { status: null, mine: false }), {
      wrapper: createWrapper(),
    });

    await waitFor(() =>
      expect(mockedApiFetchFromClient).toHaveBeenCalledWith('/schedules', {
        params: { page: 1, limit: DEFAULT_PAGE_SIZE },
      }),
    );
  });

  it('should build the query key from the page number', () => {
    expect(schedulesQueryKey(3)).toEqual(['schedules', { page: 3 }]);
  });

  it('should build the query key from the page number and filters', () => {
    expect(schedulesQueryKey(3, { status: 'APPROVED', mine: true })).toEqual([
      'schedules',
      { page: 3, status: 'APPROVED', mine: true },
    ]);
  });

  describe('useCreateScheduleMutation', () => {
    const input: CreateScheduleInput = {
      label: 'Week 32',
      startsAt: new Date('2026-08-03T00:00:00.000Z'),
      endsAt: new Date('2026-08-09T23:59:59.999Z'),
      timeZone: 'Asia/Tokyo',
    };

    it('should send schedule create request', async () => {
      mockedApiFetchFromClient.mockResolvedValue({ id: 'schedule-9' });

      const { result } = renderHook(() => useCreateScheduleMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(input);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockedApiFetchFromClient).toHaveBeenCalledWith('/schedules', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    });

    it('should refresh the schedules list after creating a schedule', async () => {
      mockedApiFetchFromClient.mockResolvedValue({ id: 'schedule-9' });
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });
      queryClient.setQueryData(schedulesQueryKey(1), makeSchedules(1));

      const { result } = renderHook(() => useCreateScheduleMutation(), {
        wrapper: createWrapperWithClient(queryClient),
      });

      result.current.mutate(input);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(
        queryClient.getQueryState(schedulesQueryKey(1))?.isInvalidated,
      ).toBe(true);
    });

    it('should refresh the schedules list even if creating the schedule fails', async () => {
      mockedApiFetchFromClient.mockRejectedValue(
        new ApiError('Request to /schedules failed with status 409', 409),
      );
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });
      queryClient.setQueryData(schedulesQueryKey(1), makeSchedules(1));

      const { result } = renderHook(() => useCreateScheduleMutation(), {
        wrapper: createWrapperWithClient(queryClient),
      });

      result.current.mutate(input);

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(
        queryClient.getQueryState(schedulesQueryKey(1))?.isInvalidated,
      ).toBe(true);
    });
  });

  describe('useUpdateScheduleMutation', () => {
    const input: UpdateScheduleInput = {
      id: 'schedule-9',
      label: 'Week 32 (renamed)',
      startsAt: new Date('2026-08-03T00:00:00.000Z'),
      endsAt: new Date('2026-08-09T23:59:59.999Z'),
      timeZone: 'Asia/Tokyo',
    };

    it('should send schedule update request', async () => {
      mockedApiFetchFromClient.mockResolvedValue({ id: 'schedule-9' });

      const { result } = renderHook(() => useUpdateScheduleMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate(input);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      const { id, ...body } = input;
      expect(mockedApiFetchFromClient).toHaveBeenCalledWith(
        `/schedules/${id}`,
        {
          method: 'PUT',
          body: JSON.stringify(body),
        },
      );
    });

    it('should refresh the schedules list after updating a schedule', async () => {
      mockedApiFetchFromClient.mockResolvedValue({ id: 'schedule-9' });
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });
      queryClient.setQueryData(schedulesQueryKey(1), makeSchedules(1));

      const { result } = renderHook(() => useUpdateScheduleMutation(), {
        wrapper: createWrapperWithClient(queryClient),
      });

      result.current.mutate(input);

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(
        queryClient.getQueryState(schedulesQueryKey(1))?.isInvalidated,
      ).toBe(true);
    });
  });

  describe('useDeleteScheduleMutation', () => {
    it('should send schedule delete request', async () => {
      mockedApiFetchFromClient.mockResolvedValue(undefined);

      const { result } = renderHook(() => useDeleteScheduleMutation(), {
        wrapper: createWrapper(),
      });

      result.current.mutate('schedule-9');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(mockedApiFetchFromClient).toHaveBeenCalledWith(
        '/schedules/schedule-9',
        { method: 'DELETE' },
      );
    });

    it('should refresh the schedules list after deleting a schedule', async () => {
      mockedApiFetchFromClient.mockResolvedValue(undefined);
      const queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });
      queryClient.setQueryData(schedulesQueryKey(1), makeSchedules(1));

      const { result } = renderHook(() => useDeleteScheduleMutation(), {
        wrapper: createWrapperWithClient(queryClient),
      });

      result.current.mutate('schedule-9');

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(
        queryClient.getQueryState(schedulesQueryKey(1))?.isInvalidated,
      ).toBe(true);
    });
  });
});
