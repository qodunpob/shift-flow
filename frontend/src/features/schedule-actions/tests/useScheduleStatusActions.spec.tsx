import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  act,
  fireEvent,
  renderHook,
  screen,
  waitFor,
} from '@testing-library/react';
import React from 'react';
import { useScheduleStatusActions } from '../useScheduleStatusActions';
import { apiFetchFromClient } from '@/lib/api/client/apiFetch';
import { toast } from 'react-toastify';
import { ScheduleStatus } from '@/lib/api/types';
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

const renderFor = (status: ScheduleStatus, resetFiltersAndPage = jest.fn()) =>
  renderHook(
    () =>
      useScheduleStatusActions(
        'schedule-1',
        status,
        'Week 32',
        resetFiltersAndPage,
      ),
    { wrapper: createWrapper() },
  );

describe('features/schedule-actions/useScheduleStatusActions', () => {
  beforeEach(() => {
    mockedApiFetchFromClient.mockReset();
  });

  it('should show only Publish for a DRAFT schedule', () => {
    const { result } = renderFor('DRAFT');

    expect(result.current.actions.map((a) => a.key)).toEqual(['publish']);
  });

  it('should show Submit for approval and Unpublish for an IN_REVIEW schedule', () => {
    const { result } = renderFor('IN_REVIEW');

    expect(result.current.actions.map((a) => a.key)).toEqual([
      'unpublish',
      'submitForApproval',
    ]);
  });

  it('should show only Withdraw for an AWAITING_APPROVAL schedule', () => {
    const { result } = renderFor('AWAITING_APPROVAL');

    expect(result.current.actions.map((a) => a.key)).toEqual(['withdraw']);
  });

  it('should show only Submit for approval for a REJECTED schedule', () => {
    const { result } = renderFor('REJECTED');

    expect(result.current.actions.map((a) => a.key)).toEqual([
      'submitForApproval',
    ]);
  });

  it('should show no actions for an APPROVED schedule', () => {
    const { result } = renderFor('APPROVED');

    expect(result.current.actions).toEqual([]);
  });

  it('should open the confirm dialog with the identity when an action is requested', () => {
    const { result } = renderFor('DRAFT');

    act(() => result.current.actions[0].request());

    expect(
      screen.getByText('ScheduleActions.confirm.publish.title'),
    ).toBeInTheDocument();
    expect(screen.getByText('Week 32')).toBeInTheDocument();
  });

  it('should call the matching transition endpoint, notify, and reset filters on confirm', async () => {
    mockedApiFetchFromClient.mockResolvedValue({});
    const resetFiltersAndPage = jest.fn();
    const { result } = renderFor('DRAFT', resetFiltersAndPage);

    act(() => result.current.actions[0].request());
    fireEvent.click(
      screen.getByText('ScheduleActions.confirm.publish.confirmLabel'),
    );

    await waitFor(() =>
      expect(mockedApiFetchFromClient).toHaveBeenCalledWith(
        '/schedules/schedule-1/publish',
        { method: 'POST' },
      ),
    );
    expect(toast.success).toHaveBeenCalledWith(
      'ScheduleActions.success.publish',
    );
    expect(resetFiltersAndPage).toHaveBeenCalled();
  });

  it('should show a generic error when the transition fails', async () => {
    mockedApiFetchFromClient.mockRejectedValue(new Error('network down'));
    const { result } = renderFor('DRAFT');

    act(() => result.current.actions[0].request());
    fireEvent.click(
      screen.getByText('ScheduleActions.confirm.publish.confirmLabel'),
    );

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith('commonErrors.generic'),
    );
  });
});
