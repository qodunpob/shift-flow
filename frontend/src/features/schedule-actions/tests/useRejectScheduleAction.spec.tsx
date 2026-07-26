import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { useRejectScheduleAction } from '../useRejectScheduleAction';
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

describe('features/schedule-actions/useRejectScheduleAction', () => {
  it('should start not confirming with an empty reason', () => {
    const { result } = renderHook(
      () => useRejectScheduleAction('schedule-1', jest.fn()),
      { wrapper: createWrapper() },
    );

    expect(result.current.isConfirming).toBe(false);
    expect(result.current.rejectionReason).toBe('');
    expect(result.current.canConfirm).toBe(false);
  });

  it('should start confirming when requestReject is called', () => {
    const { result } = renderHook(
      () => useRejectScheduleAction('schedule-1', jest.fn()),
      { wrapper: createWrapper() },
    );

    act(() => result.current.requestReject());

    expect(result.current.isConfirming).toBe(true);
  });

  it('should require a non-blank reason before allowing confirm', () => {
    const { result } = renderHook(
      () => useRejectScheduleAction('schedule-1', jest.fn()),
      { wrapper: createWrapper() },
    );

    act(() => result.current.setRejectionReason('   '));
    expect(result.current.canConfirm).toBe(false);

    act(() => result.current.setRejectionReason('Understaffed'));
    expect(result.current.canConfirm).toBe(true);
  });

  it('should clear the reason and stop confirming when cancel is called', () => {
    const { result } = renderHook(
      () => useRejectScheduleAction('schedule-1', jest.fn()),
      { wrapper: createWrapper() },
    );

    act(() => result.current.requestReject());
    act(() => result.current.setRejectionReason('Understaffed'));
    act(() => result.current.cancel());

    expect(result.current.isConfirming).toBe(false);
    expect(result.current.rejectionReason).toBe('');
  });

  it('should reject the schedule with the given reason, notify, call onSuccess, and reset', async () => {
    mockedApiFetchFromClient.mockResolvedValue({});
    const onSuccess = jest.fn();
    const { result } = renderHook(
      () => useRejectScheduleAction('schedule-1', onSuccess),
      { wrapper: createWrapper() },
    );

    act(() => result.current.requestReject());
    act(() => result.current.setRejectionReason('Understaffed'));
    act(() => result.current.confirm());

    await waitFor(() => expect(result.current.isConfirming).toBe(false));

    expect(mockedApiFetchFromClient).toHaveBeenCalledWith(
      '/schedules/schedule-1/reject',
      {
        method: 'POST',
        body: JSON.stringify({ rejectionReason: 'Understaffed' }),
      },
    );
    expect(toast.success).toHaveBeenCalledWith(
      'ScheduleActions.success.reject',
    );
    expect(onSuccess).toHaveBeenCalled();
    expect(result.current.rejectionReason).toBe('');
  });

  it('should show a generic error and stop confirming (keeping the reason) when rejection fails', async () => {
    mockedApiFetchFromClient.mockRejectedValue(new Error('network down'));
    const { result } = renderHook(
      () => useRejectScheduleAction('schedule-1', jest.fn()),
      { wrapper: createWrapper() },
    );

    act(() => result.current.requestReject());
    act(() => result.current.setRejectionReason('Understaffed'));
    act(() => result.current.confirm());

    await waitFor(() => expect(result.current.isConfirming).toBe(false));

    expect(toast.error).toHaveBeenCalledWith('commonErrors.generic');
    expect(result.current.rejectionReason).toBe('Understaffed');
  });
});
