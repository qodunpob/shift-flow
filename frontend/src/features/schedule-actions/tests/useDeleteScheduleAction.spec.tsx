import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { useDeleteScheduleAction } from '../useDeleteScheduleAction';
import { apiFetchFromClient } from '@/lib/api/client/apiFetch';
import { toast } from 'react-toastify';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

jest.mock('@/lib/api/client/apiFetch', () => ({
  apiFetchFromClient: jest.fn(),
}));

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

const mockedApiFetchFromClient = apiFetchFromClient as jest.MockedFunction<
  typeof apiFetchFromClient
>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

describe('features/schedule-actions/useDeleteScheduleAction', () => {
  it('should start not confirming', () => {
    const { result } = renderHook(
      () => useDeleteScheduleAction('schedule-1', jest.fn()),
      { wrapper: createWrapper() },
    );

    expect(result.current.isConfirming).toBe(false);
  });

  it('should start confirming when requestDelete is called', () => {
    const { result } = renderHook(
      () => useDeleteScheduleAction('schedule-1', jest.fn()),
      { wrapper: createWrapper() },
    );

    act(() => result.current.requestDelete());

    expect(result.current.isConfirming).toBe(true);
  });

  it('should stop confirming when cancel is called', () => {
    const { result } = renderHook(
      () => useDeleteScheduleAction('schedule-1', jest.fn()),
      { wrapper: createWrapper() },
    );

    act(() => result.current.requestDelete());
    act(() => result.current.cancel());

    expect(result.current.isConfirming).toBe(false);
  });

  it('should delete the schedule, notify, reset filters, and stop confirming on success', async () => {
    mockedApiFetchFromClient.mockResolvedValue(undefined);
    const resetFiltersAndPage = jest.fn();
    const { result } = renderHook(
      () => useDeleteScheduleAction('schedule-1', resetFiltersAndPage),
      { wrapper: createWrapper() },
    );

    act(() => result.current.requestDelete());
    act(() => result.current.confirm());

    await waitFor(() => expect(result.current.isConfirming).toBe(false));

    expect(mockedApiFetchFromClient).toHaveBeenCalledWith(
      '/schedules/schedule-1',
      { method: 'DELETE' },
    );
    expect(toast.success).toHaveBeenCalledWith(
      'ScheduleActions.success.deleted',
    );
    expect(resetFiltersAndPage).toHaveBeenCalled();
  });

  it('should show a generic error and stop confirming when deletion fails', async () => {
    mockedApiFetchFromClient.mockRejectedValue(new Error('network down'));
    const { result } = renderHook(
      () => useDeleteScheduleAction('schedule-1', jest.fn()),
      { wrapper: createWrapper() },
    );

    act(() => result.current.requestDelete());
    act(() => result.current.confirm());

    await waitFor(() => expect(result.current.isConfirming).toBe(false));

    expect(toast.error).toHaveBeenCalledWith('ScheduleActions.errors.generic');
  });
});
