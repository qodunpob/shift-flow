import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { Settings } from 'luxon';
import React from 'react';
import { AssignmentsModal } from '@/features/shift-assignments/AssignmentsModal';
import { CurrentUserProvider } from '@/providers/CurrentUserProvider';
import { CurrentUser, Shift } from '@/lib/api/types';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'fallback',
}));

jest.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn(), push: jest.fn() }),
}));

const baseShift: Shift = {
  id: 'shift-1',
  scheduleId: 'schedule-1',
  createdAt: '2026-07-20T00:00:00.000Z',
  createdBy: 'manager-1',
  updatedAt: '2026-07-20T00:00:00.000Z',
  updatedBy: 'manager-1',
  deletedAt: null,
  // 2026-08-02T23:00:00.000Z is 2026-08-03T08:00:00+09:00 in Tokyo.
  startsAt: '2026-08-02T23:00:00.000Z',
  // 2026-08-03T07:30:00.000Z is 2026-08-03T16:30:00+09:00 in Tokyo.
  endsAt: '2026-08-03T07:30:00.000Z',
  requiredHeadcount: 3,
  filledCount: 1,
  spotsRemaining: 2,
  assignments: [
    {
      id: 'assignment-1',
      employeeId: 'employee-1',
      employee: { id: 'employee-1', firstName: 'Ada', lastName: 'Lovelace' },
      status: 'ACCEPTED',
      declineReason: null,
    },
  ],
  proposals: [
    {
      id: 'proposal-1',
      employeeId: 'employee-2',
      employee: { id: 'employee-2', firstName: 'Grace', lastName: 'Hopper' },
      message: null,
      createdAt: '2026-07-21T00:00:00.000Z',
    },
  ],
};

const employeeViewer: CurrentUser = {
  id: 'employee-1',
  createdAt: '2026-07-20T00:00:00.000Z',
  createdBy: 'manager-1',
  updatedAt: '2026-07-20T00:00:00.000Z',
  updatedBy: 'manager-1',
  deletedAt: null,
  firstName: 'Ada',
  lastName: 'Lovelace',
  roles: ['EMPLOYEE'],
};

const managerAuthorViewer: CurrentUser = {
  ...employeeViewer,
  id: 'manager-1',
  roles: ['MANAGER'],
};

const managerOtherViewer: CurrentUser = {
  ...employeeViewer,
  id: 'manager-2',
  roles: ['MANAGER'],
};

const renderModal = (
  props: Partial<{
    shift: Shift;
    timeZone: string;
    scheduleCreatedBy: string;
    onClose: () => void;
  }> = {},
  viewer: CurrentUser = employeeViewer,
) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <CurrentUserProvider user={viewer}>
        <AssignmentsModal
          shift={baseShift}
          timeZone="Asia/Tokyo"
          scheduleCreatedBy="manager-1"
          onClose={jest.fn()}
          {...props}
        />
      </CurrentUserProvider>
    </QueryClientProvider>,
  );
};

describe('features/shift-assignments/AssignmentsModal', () => {
  beforeEach(() => {
    Settings.defaultZone = 'America/New_York';
  });

  afterEach(() => {
    Settings.defaultZone = 'system';
  });

  it("should show the shift's boundary times in the given time zone, not the runtime's", () => {
    renderModal();

    expect(screen.getByText('08/03 08:00 – 08/03 16:30')).toBeInTheDocument();
  });

  it('should show the required headcount', () => {
    renderModal();

    expect(screen.getByText('labels.requiredHeadcount: 3')).toBeInTheDocument();
  });

  it('should list each assigned employee by name', () => {
    renderModal();

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
  });

  it('should list each proposed employee by name', () => {
    renderModal();

    expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
  });

  it('should show an empty state when there are no assignments', () => {
    renderModal({ shift: { ...baseShift, assignments: [] } });

    expect(
      screen.getByText('ShiftAssignments.noneAssigned'),
    ).toBeInTheDocument();
  });

  it('should not show the proposals section when there are no proposals', () => {
    renderModal({ shift: { ...baseShift, proposals: [] } });

    expect(
      screen.queryByText('ShiftAssignments.proposals'),
    ).not.toBeInTheDocument();
  });

  it('should call onClose when the close button is clicked', () => {
    const onClose = jest.fn();
    renderModal({ onClose });

    fireEvent.click(screen.getByText('common.close'));

    expect(onClose).toHaveBeenCalled();
  });

  describe('assign button visibility', () => {
    it("should show the assign button for the schedule's own manager", () => {
      renderModal({}, managerAuthorViewer);

      expect(screen.getByText('ShiftAssignments.assign')).toBeInTheDocument();
    });

    it("should not show the assign button for a manager who isn't the schedule's author", () => {
      renderModal({}, managerOtherViewer);

      expect(
        screen.queryByText('ShiftAssignments.assign'),
      ).not.toBeInTheDocument();
    });

    it('should not show the assign button for an employee', () => {
      renderModal({}, employeeViewer);

      expect(
        screen.queryByText('ShiftAssignments.assign'),
      ).not.toBeInTheDocument();
    });

    it('should not show the assign button once the shift has no remaining spots', () => {
      renderModal(
        { shift: { ...baseShift, spotsRemaining: 0 } },
        managerAuthorViewer,
      );

      expect(
        screen.queryByText('ShiftAssignments.assign'),
      ).not.toBeInTheDocument();
    });
  });
});
