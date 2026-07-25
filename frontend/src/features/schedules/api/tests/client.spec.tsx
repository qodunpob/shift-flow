import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { DEFAULT_PAGE_SIZE } from '@/constants/common';
import {
  schedulesQueryKey,
  useSchedulesQuery,
} from '@/features/schedules/api/client';
import { apiFetchFromClient } from '@/lib/api/client/apiFetch';
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
  beforeEach(() => {
    mockedApiFetchFromClient.mockReset();
  });

  it('should use initialData without calling apiFetchFromClient on first render', async () => {
    const initialData = makeSchedules(1);

    const { result } = renderHook(() => useSchedulesQuery(1, initialData), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toEqual(initialData);
    expect(mockedApiFetchFromClient).not.toHaveBeenCalled();
  });

  it('should fetch fresh data when no initialData is provided for the page', async () => {
    const pageTwoData = makeSchedules(2);
    mockedApiFetchFromClient.mockResolvedValue(pageTwoData);

    const { result } = renderHook(() => useSchedulesQuery(2), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.data).toEqual(pageTwoData));

    expect(mockedApiFetchFromClient).toHaveBeenCalledWith('/schedules', {
      params: { page: 2, limit: DEFAULT_PAGE_SIZE },
    });
  });

  it('should build the query key from the page number', () => {
    expect(schedulesQueryKey(3)).toEqual(['schedules', { page: 3 }]);
  });
});
