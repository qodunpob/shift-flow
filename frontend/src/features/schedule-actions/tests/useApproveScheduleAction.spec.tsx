import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { useApproveScheduleAction } from '../useApproveScheduleAction';
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

describe('features/schedule-actions/useApproveScheduleAction', () => {
  it('should start not confirming', () => {
    const { result } = renderHook(
      () => useApproveScheduleAction('schedule-1', jest.fn()),
      { wrapper: createWrapper() },
    );

    expect(result.current.isConfirming).toBe(false);
  });

  it('should start confirming when requestApprove is called', () => {
    const { result } = renderHook(
      () => useApproveScheduleAction('schedule-1', jest.fn()),
      { wrapper: createWrapper() },
    );

    act(() => result.current.requestApprove());

    expect(result.current.isConfirming).toBe(true);
  });

  it('should stop confirming when cancel is called', () => {
    const { result } = renderHook(
      () => useApproveScheduleAction('schedule-1', jest.fn()),
      { wrapper: createWrapper() },
    );

    act(() => result.current.requestApprove());
    act(() => result.current.cancel());

    expect(result.current.isConfirming).toBe(false);
  });

  it('should approve the schedule, notify, call onSuccess, and stop confirming on success', async () => {
    mockedApiFetchFromClient.mockResolvedValue({});
    const onSuccess = jest.fn();
    const { result } = renderHook(
      () => useApproveScheduleAction('schedule-1', onSuccess),
      { wrapper: createWrapper() },
    );

    act(() => result.current.requestApprove());
    act(() => result.current.confirm());

    await waitFor(() => expect(result.current.isConfirming).toBe(false));

    expect(mockedApiFetchFromClient).toHaveBeenCalledWith(
      '/schedules/schedule-1/approve',
      { method: 'POST' },
    );
    expect(toast.success).toHaveBeenCalledWith(
      'ScheduleActions.success.approve',
    );
    expect(onSuccess).toHaveBeenCalled();
  });

  it('should show a generic error and stop confirming when approval fails', async () => {
    mockedApiFetchFromClient.mockRejectedValue(new Error('network down'));
    const { result } = renderHook(
      () => useApproveScheduleAction('schedule-1', jest.fn()),
      { wrapper: createWrapper() },
    );

    act(() => result.current.requestApprove());
    act(() => result.current.confirm());

    await waitFor(() => expect(result.current.isConfirming).toBe(false));

    expect(toast.error).toHaveBeenCalledWith('commonErrors.generic');
  });
});
