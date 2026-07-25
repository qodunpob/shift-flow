import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { useWithdrawScheduleMutation } from '@/features/schedules/api/client-transition';
import { schedulesQueryKey } from '@/features/schedules/api/client';
import { apiFetchFromClient } from '@/lib/api/client/apiFetch';

import { PaginatedSchedules } from '@/lib/api/types';

jest.mock('@/lib/api/client/apiFetch', () => ({
  apiFetchFromClient: jest.fn(),
}));

const mockedApiFetchFromClient = apiFetchFromClient as jest.MockedFunction<
  typeof apiFetchFromClient
>;

const schedulesPage1: PaginatedSchedules = {
  items: [
    {
      id: 'schedule-1',
      createdAt: '2026-07-20T00:00:00.000+09:00',
      createdBy: 'manager-1',
      updatedAt: '2026-07-20T00:00:00.000+09:00',
      updatedBy: 'manager-1',
      deletedAt: null,
      label: 'Week 31 — In Review',
      startsAt: '2026-07-27T00:00:00.000+09:00',
      endsAt: '2026-08-02T23:59:59.999+09:00',
      status: 'IN_REVIEW',
      rejectionReason: null,
      totalRequiredHeadcount: 5,
      totalFilledCount: 3,
      totalAcceptedCount: 2,
    },
  ],
  meta: { total: 1, page: 1, limit: 10, totalPages: 1 },
};

const createWrapper = (queryClient: QueryClient) =>
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

describe('features/schedules/api/client-transition', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    mockedApiFetchFromClient.mockReset();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    queryClient.setQueryData(schedulesQueryKey(1), schedulesPage1);
  });

  it('should optimistically set the schedule status to DRAFT before the request resolves', async () => {
    let resolveRequest: (value: unknown) => void = () => {};
    mockedApiFetchFromClient.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );

    const { result } = renderHook(() => useWithdrawScheduleMutation(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate('schedule-1');

    await waitFor(() => {
      const cached = queryClient.getQueryData<PaginatedSchedules>(
        schedulesQueryKey(1),
      );
      expect(cached?.items[0].status).toBe('DRAFT');
    });

    resolveRequest({});
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });

  it('should roll back to the previous status when the request fails', async () => {
    mockedApiFetchFromClient.mockRejectedValue(new Error('Request failed'));

    const { result } = renderHook(() => useWithdrawScheduleMutation(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate('schedule-1');

    await waitFor(() => expect(result.current.isError).toBe(true));

    const cached = queryClient.getQueryData<PaginatedSchedules>(
      schedulesQueryKey(1),
    );
    expect(cached?.items[0].status).toBe('IN_REVIEW');
  });

  it('should call the withdraw endpoint with the schedule id', async () => {
    mockedApiFetchFromClient.mockResolvedValue({});

    const { result } = renderHook(() => useWithdrawScheduleMutation(), {
      wrapper: createWrapper(queryClient),
    });

    result.current.mutate('schedule-1');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockedApiFetchFromClient).toHaveBeenCalledWith(
      '/schedules/schedule-1/withdraw',
      { method: 'POST' },
    );
  });
});
