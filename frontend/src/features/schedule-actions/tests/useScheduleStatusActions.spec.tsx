import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import React from 'react';
import { useScheduleStatusActions } from '../useScheduleStatusActions';
import { apiFetchFromClient } from '@/lib/api/client/apiFetch';
import { toast } from 'react-toastify';
import { ScheduleStatus } from '@/lib/api/types';

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

const renderFor = (status: ScheduleStatus, resetFiltersAndPage = jest.fn()) =>
  renderHook(
    () => useScheduleStatusActions('schedule-1', status, resetFiltersAndPage),
    { wrapper: createWrapper() },
  );

describe('features/schedule-actions/useScheduleStatusActions', () => {
  it('should show only Publish for a DRAFT schedule', () => {
    const { result } = renderFor('DRAFT');

    expect(result.current.actions.map((a) => a.key)).toEqual(['publish']);
  });

  it('should show Submit for approval and Unpublish for an IN_REVIEW schedule', () => {
    const { result } = renderFor('IN_REVIEW');

    expect(result.current.actions.map((a) => a.key)).toEqual([
      'submitForApproval',
      'unpublish',
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

  it('should set pendingAction when an action is requested', () => {
    const { result } = renderFor('DRAFT');

    act(() => result.current.actions[0].request());

    expect(result.current.pendingAction).toEqual({
      key: 'publish',
      label: 'ScheduleActions.publish',
    });
  });

  it('should clear pendingAction when cancel is called', () => {
    const { result } = renderFor('DRAFT');

    act(() => result.current.actions[0].request());
    act(() => result.current.cancel());

    expect(result.current.pendingAction).toBeNull();
  });

  it('should call the matching transition endpoint, notify, reset filters, and clear pendingAction on confirm', async () => {
    mockedApiFetchFromClient.mockResolvedValue({});
    const resetFiltersAndPage = jest.fn();
    const { result } = renderFor('DRAFT', resetFiltersAndPage);

    act(() => result.current.actions[0].request());
    act(() => result.current.confirm());

    await waitFor(() => expect(result.current.pendingAction).toBeNull());

    expect(mockedApiFetchFromClient).toHaveBeenCalledWith(
      '/schedules/schedule-1/publish',
      { method: 'POST' },
    );
    expect(toast.success).toHaveBeenCalledWith(
      'ScheduleActions.success.publish',
    );
    expect(resetFiltersAndPage).toHaveBeenCalled();
  });

  it('should show a generic error and clear pendingAction when the transition fails', async () => {
    mockedApiFetchFromClient.mockRejectedValue(new Error('network down'));
    const { result } = renderFor('DRAFT');

    act(() => result.current.actions[0].request());
    act(() => result.current.confirm());

    await waitFor(() => expect(result.current.pendingAction).toBeNull());

    expect(toast.error).toHaveBeenCalledWith('commonErrors.generic');
  });
});
