import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import React from 'react';
import { useDeleteScheduleAction } from '../useDeleteScheduleAction';
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

describe('features/schedule-actions/useDeleteScheduleAction', () => {
  beforeEach(() => {
    mockedApiFetchFromClient.mockReset();
  });

  it('should open the confirm dialog with the given identity when requestDelete is called', () => {
    const { result } = renderHook(
      () => useDeleteScheduleAction('schedule-1', 'Week 32', jest.fn()),
      { wrapper: createWrapper() },
    );

    act(() => result.current.requestDelete());

    expect(
      screen.getByText('ScheduleActions.confirm.delete.title'),
    ).toBeInTheDocument();
    expect(screen.getByText('Week 32')).toBeInTheDocument();
  });

  it('should delete the schedule, notify, and reset filters when confirmed', async () => {
    mockedApiFetchFromClient.mockResolvedValue(undefined);
    const resetFiltersAndPage = jest.fn();
    const { result } = renderHook(
      () =>
        useDeleteScheduleAction('schedule-1', 'Week 32', resetFiltersAndPage),
      { wrapper: createWrapper() },
    );

    act(() => result.current.requestDelete());
    fireEvent.click(
      screen.getByText('ScheduleActions.confirm.delete.confirmLabel'),
    );

    await waitFor(() =>
      expect(mockedApiFetchFromClient).toHaveBeenCalledWith(
        '/schedules/schedule-1',
        { method: 'DELETE' },
      ),
    );
    expect(toast.success).toHaveBeenCalledWith(
      'ScheduleActions.success.deleted',
    );
    expect(resetFiltersAndPage).toHaveBeenCalled();
  });

  it('should show a generic error when deletion fails', async () => {
    mockedApiFetchFromClient.mockRejectedValue(new Error('network down'));
    const { result } = renderHook(
      () => useDeleteScheduleAction('schedule-1', 'Week 32', jest.fn()),
      { wrapper: createWrapper() },
    );

    act(() => result.current.requestDelete());
    fireEvent.click(
      screen.getByText('ScheduleActions.confirm.delete.confirmLabel'),
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('commonErrors.generic'),
    );
  });
});
