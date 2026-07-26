import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import React from 'react';
import { useApproveScheduleAction } from '../useApproveScheduleAction';
import { apiFetchFromClient } from '@/lib/api/client/apiFetch';
import { toast } from 'react-toastify';
import { ConfirmDialogProvider } from '@/providers/ConfirmDialogProvider';

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
      <QueryClientProvider client={queryClient}>
        <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
      </QueryClientProvider>
    );
  };
};

describe('features/schedule-actions/useApproveScheduleAction', () => {
  beforeEach(() => {
    mockedApiFetchFromClient.mockReset();
  });

  it('should open the confirm dialog with the given identity when requestApprove is called', () => {
    const { result } = renderHook(
      () => useApproveScheduleAction('schedule-1', 'Week 32', jest.fn()),
      { wrapper: createWrapper() },
    );

    act(() => result.current.requestApprove());

    expect(
      screen.getByText('ScheduleActions.confirm.approve.title'),
    ).toBeInTheDocument();
    expect(screen.getByText('Week 32')).toBeInTheDocument();
  });

  it('should approve the schedule, notify, and call onSuccess when confirmed', async () => {
    mockedApiFetchFromClient.mockResolvedValue({});
    const onSuccess = jest.fn();
    const { result } = renderHook(
      () => useApproveScheduleAction('schedule-1', 'Week 32', onSuccess),
      { wrapper: createWrapper() },
    );

    act(() => result.current.requestApprove());
    fireEvent.click(
      screen.getByText('ScheduleActions.confirm.approve.confirmLabel'),
    );

    await waitFor(() =>
      expect(mockedApiFetchFromClient).toHaveBeenCalledWith(
        '/schedules/schedule-1/approve',
        { method: 'POST' },
      ),
    );
    expect(toast.success).toHaveBeenCalledWith(
      'ScheduleActions.success.approve',
    );
    expect(onSuccess).toHaveBeenCalled();
  });

  it('should show a generic error when approval fails', async () => {
    mockedApiFetchFromClient.mockRejectedValue(new Error('network down'));
    const { result } = renderHook(
      () => useApproveScheduleAction('schedule-1', 'Week 32', jest.fn()),
      { wrapper: createWrapper() },
    );

    act(() => result.current.requestApprove());
    fireEvent.click(
      screen.getByText('ScheduleActions.confirm.approve.confirmLabel'),
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('commonErrors.generic'),
    );
  });
});
