import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { ScheduleActionsMenu } from '../ScheduleActionsMenu';
import { apiFetchFromClient } from '@/lib/api/client/apiFetch';
import { Schedule } from '@/lib/api/types';
import { ConfirmDialogProvider } from '@/providers/ConfirmDialogProvider';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'fallback',
}));

jest.mock('@/lib/api/client/apiFetch', () => ({
  apiFetchFromClient: jest.fn(),
}));

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

jest.mock('@/features/schedule-form/ScheduleFormModal', () => ({
  ScheduleFormModal: ({ mode }: { mode: string }) => (
    <div data-testid="schedule-form-modal">{mode}</div>
  ),
}));

const mockedApiFetchFromClient = apiFetchFromClient as jest.MockedFunction<
  typeof apiFetchFromClient
>;

const makeSchedule = (overrides: Partial<Schedule> = {}): Schedule => ({
  id: 'schedule-1',
  createdAt: '2026-07-20T00:00:00.000Z',
  createdBy: 'manager-1',
  updatedAt: '2026-07-20T00:00:00.000Z',
  updatedBy: 'manager-1',
  deletedAt: null,
  label: 'Week 32',
  startsAt: '2026-08-03T00:00:00.000Z',
  endsAt: '2026-08-09T00:00:00.000Z',
  timeZone: 'UTC',
  status: 'DRAFT',
  rejectionReason: null,
  totalRequiredHeadcount: 0,
  totalFilledCount: 0,
  totalAcceptedCount: 0,
  ...overrides,
});

const renderMenu = (schedule: Schedule, resetFiltersAndPage = jest.fn()) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <ConfirmDialogProvider>
        <ScheduleActionsMenu
          schedule={schedule}
          resetFiltersAndPage={resetFiltersAndPage}
        />
      </ConfirmDialogProvider>
    </QueryClientProvider>,
  );
  return { resetFiltersAndPage };
};

const openMenu = () =>
  fireEvent.click(screen.getByLabelText('ScheduleActions.menu'));

describe('features/schedule-actions/ScheduleActionsMenu', () => {
  it('should list Edit, the available status actions, and Delete for a DRAFT schedule', () => {
    renderMenu(makeSchedule({ status: 'DRAFT' }));

    openMenu();

    expect(screen.getByText('ScheduleActions.edit')).toBeInTheDocument();
    expect(screen.getByText('ScheduleActions.publish')).toBeInTheDocument();
    expect(screen.getByText('ScheduleActions.delete')).toBeInTheDocument();
  });

  it('should hide Edit and Delete but still show Withdraw for an AWAITING_APPROVAL schedule', () => {
    renderMenu(makeSchedule({ status: 'AWAITING_APPROVAL' }));

    openMenu();

    expect(screen.queryByText('ScheduleActions.edit')).not.toBeInTheDocument();
    expect(
      screen.queryByText('ScheduleActions.delete'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('ScheduleActions.withdraw')).toBeInTheDocument();
  });

  it('should not show the actions menu at all for an APPROVED schedule', () => {
    renderMenu(makeSchedule({ status: 'APPROVED' }));

    expect(
      screen.queryByLabelText('ScheduleActions.menu'),
    ).not.toBeInTheDocument();
  });

  it('should open the edit modal in edit mode when Edit is clicked', () => {
    renderMenu(makeSchedule({ status: 'DRAFT' }));

    openMenu();
    fireEvent.click(screen.getByText('ScheduleActions.edit'));

    expect(screen.getByTestId('schedule-form-modal')).toHaveTextContent('edit');
  });

  it('should show the delete confirmation dialog with the schedule identity when Delete is clicked', () => {
    renderMenu(makeSchedule({ status: 'DRAFT', label: 'Week 32' }));

    openMenu();
    fireEvent.click(screen.getByText('ScheduleActions.delete'));

    expect(
      screen.getByText('ScheduleActions.confirm.delete.title'),
    ).toBeInTheDocument();
    expect(screen.getByText('Week 32')).toBeInTheDocument();
  });

  it('should delete the schedule when the delete confirmation is confirmed', async () => {
    mockedApiFetchFromClient.mockResolvedValue(undefined);
    renderMenu(makeSchedule({ status: 'DRAFT', id: 'schedule-1' }));

    openMenu();
    fireEvent.click(screen.getByText('ScheduleActions.delete'));
    fireEvent.click(
      screen.getByText('ScheduleActions.confirm.delete.confirmLabel'),
    );

    await waitFor(() =>
      expect(mockedApiFetchFromClient).toHaveBeenCalledWith(
        '/schedules/schedule-1',
        { method: 'DELETE' },
      ),
    );
  });

  it('should show the status-action confirmation dialog with the schedule identity when a status action is clicked', () => {
    renderMenu(makeSchedule({ status: 'DRAFT', label: 'Week 32' }));

    openMenu();
    fireEvent.click(screen.getByText('ScheduleActions.publish'));

    expect(
      screen.getByText('ScheduleActions.confirm.publish.title'),
    ).toBeInTheDocument();
    expect(screen.getByText('Week 32')).toBeInTheDocument();
  });

  it('should call the transition endpoint when a status action is confirmed', async () => {
    mockedApiFetchFromClient.mockResolvedValue({});
    renderMenu(makeSchedule({ status: 'DRAFT', id: 'schedule-1' }));

    openMenu();
    fireEvent.click(screen.getByText('ScheduleActions.publish'));
    fireEvent.click(
      screen.getByText('ScheduleActions.confirm.publish.confirmLabel'),
    );

    await waitFor(() =>
      expect(mockedApiFetchFromClient).toHaveBeenCalledWith(
        '/schedules/schedule-1/publish',
        { method: 'POST' },
      ),
    );
  });
});
