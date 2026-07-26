import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Settings } from 'luxon';
import React from 'react';
import { AssignmentsModal } from '@/features/shift-assignments/AssignmentsModal';
import { CurrentUserProvider } from '@/providers/CurrentUserProvider';
import { ScheduleProvider } from '@/features/schedule-details/ScheduleProvider';
import { CurrentUser, Schedule, Shift } from '@/lib/api/types';
import { apiFetchFromClient } from '@/lib/api/client/apiFetch';
import { ApiError } from '@/lib/errors/ApiError';
import { toast } from 'react-toastify';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'fallback',
}));

const mockRouterRefresh = jest.fn();
jest.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ refresh: mockRouterRefresh, push: jest.fn() }),
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

const baseSchedule: Schedule = {
  id: 'schedule-1',
  createdAt: '2026-07-20T00:00:00.000Z',
  createdBy: 'manager-1',
  updatedAt: '2026-07-20T00:00:00.000Z',
  updatedBy: 'manager-1',
  deletedAt: null,
  label: 'Week 32',
  startsAt: '2026-08-02T15:00:00.000Z',
  endsAt: '2026-08-09T14:59:59.999Z',
  timeZone: 'Asia/Tokyo',
  status: 'DRAFT',
  rejectionReason: null,
  totalRequiredHeadcount: 5,
  totalFilledCount: 0,
  totalAcceptedCount: 0,
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

// Not the employee-1 assignment nor the employee-2 proposal in baseShift -
// an employee with nothing to do with this shift yet.
const uninvolvedEmployeeViewer: CurrentUser = {
  ...employeeViewer,
  id: 'employee-3',
  roles: ['EMPLOYEE'],
};

// Matches baseShift's existing proposal's employeeId.
const proposingEmployeeViewer: CurrentUser = {
  ...employeeViewer,
  id: 'employee-2',
  roles: ['EMPLOYEE'],
};

const renderModal = (
  props: Partial<{
    shift: Shift;
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
        <ScheduleProvider schedule={baseSchedule}>
          <AssignmentsModal shift={baseShift} onClose={jest.fn()} {...props} />
        </ScheduleProvider>
      </CurrentUserProvider>
    </QueryClientProvider>,
  );
};

describe('features/shift-assignments/AssignmentsModal', () => {
  beforeEach(() => {
    Settings.defaultZone = 'America/New_York';
    mockedApiFetchFromClient.mockReset();
    mockRouterRefresh.mockReset();
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

  describe('remove assignment button', () => {
    it("should show a remove button on an assignment for the schedule's own manager", () => {
      renderModal({}, managerAuthorViewer);

      expect(
        screen.getByLabelText('ShiftAssignments.remove'),
      ).toBeInTheDocument();
    });

    it('should not show a remove button for an employee', () => {
      renderModal({}, employeeViewer);

      expect(
        screen.queryByLabelText('ShiftAssignments.remove'),
      ).not.toBeInTheDocument();
    });

    it("should not show a remove button for a manager who isn't the schedule's author", () => {
      renderModal({}, managerOtherViewer);

      expect(
        screen.queryByLabelText('ShiftAssignments.remove'),
      ).not.toBeInTheDocument();
    });

    it('should not show a remove button on a proposal', () => {
      renderModal(
        { shift: { ...baseShift, assignments: [] } },
        managerAuthorViewer,
      );

      expect(
        screen.queryByLabelText('ShiftAssignments.remove'),
      ).not.toBeInTheDocument();
      expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
    });

    it('should remove the assignment, notify the user, and refresh the page', async () => {
      mockedApiFetchFromClient.mockResolvedValue(undefined);
      renderModal({}, managerAuthorViewer);

      fireEvent.click(screen.getByLabelText('ShiftAssignments.remove'));

      await waitFor(() =>
        expect(mockedApiFetchFromClient).toHaveBeenCalledWith(
          '/assignments/assignment-1',
          { method: 'DELETE' },
        ),
      );
      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith(
          'ShiftAssignments.removeSuccess',
        ),
      );
      expect(mockRouterRefresh).toHaveBeenCalled();
    });

    it('should show a distinct error when removal conflicts with the current state', async () => {
      mockedApiFetchFromClient.mockRejectedValue(
        new ApiError(
          'Request to /assignments/assignment-1 failed with status 409',
          409,
        ),
      );
      renderModal({}, managerAuthorViewer);

      fireEvent.click(screen.getByLabelText('ShiftAssignments.remove'));

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('commonErrors.conflict'),
      );
    });

    it('should show a generic error when removal fails for another reason', async () => {
      mockedApiFetchFromClient.mockRejectedValue(new Error('network down'));
      renderModal({}, managerAuthorViewer);

      fireEvent.click(screen.getByLabelText('ShiftAssignments.remove'));

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('commonErrors.generic'),
      );
    });
  });

  describe('propose button visibility', () => {
    it('should show the propose button for an employee not yet involved with the shift', () => {
      renderModal({}, uninvolvedEmployeeViewer);

      expect(screen.getByText('ShiftAssignments.propose')).toBeInTheDocument();
    });

    it('should not show the propose button for a manager', () => {
      renderModal({}, managerAuthorViewer);

      expect(
        screen.queryByText('ShiftAssignments.propose'),
      ).not.toBeInTheDocument();
    });

    it('should not show the propose button for an employee already assigned to the shift', () => {
      renderModal({}, employeeViewer);

      expect(
        screen.queryByText('ShiftAssignments.propose'),
      ).not.toBeInTheDocument();
    });

    it('should not show the propose button for an employee who already has a proposal', () => {
      renderModal({}, proposingEmployeeViewer);

      expect(
        screen.queryByText('ShiftAssignments.propose'),
      ).not.toBeInTheDocument();
    });
  });

  describe('propose button behavior', () => {
    it('should send a proposal request, notify the user, and refresh the page', async () => {
      mockedApiFetchFromClient.mockResolvedValue({});
      renderModal({}, uninvolvedEmployeeViewer);

      fireEvent.click(screen.getByText('ShiftAssignments.propose'));

      await waitFor(() =>
        expect(mockedApiFetchFromClient).toHaveBeenCalledWith(
          '/shifts/shift-1/assignment-proposals',
          { method: 'POST', body: JSON.stringify({}) },
        ),
      );
      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith(
          'ShiftAssignments.proposeSuccess',
        ),
      );
      expect(mockRouterRefresh).toHaveBeenCalled();
    });

    it('should show a distinct error when proposing conflicts with the current state', async () => {
      mockedApiFetchFromClient.mockRejectedValue(
        new ApiError(
          'Request to /shifts/shift-1/assignment-proposals failed with status 409',
          409,
        ),
      );
      renderModal({}, uninvolvedEmployeeViewer);

      fireEvent.click(screen.getByText('ShiftAssignments.propose'));

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('commonErrors.conflict'),
      );
    });

    it('should show a generic error when proposing fails for another reason', async () => {
      mockedApiFetchFromClient.mockRejectedValue(new Error('network down'));
      renderModal({}, uninvolvedEmployeeViewer);

      fireEvent.click(screen.getByText('ShiftAssignments.propose'));

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('commonErrors.generic'),
      );
    });
  });

  describe('proposal action visibility', () => {
    it('should show a remove button on the proposal for the employee who created it', () => {
      renderModal({}, proposingEmployeeViewer);

      expect(
        screen.getByLabelText('ShiftAssignments.remove'),
      ).toBeInTheDocument();
    });

    it('should not show a remove button on the proposal for a different employee', () => {
      renderModal({}, uninvolvedEmployeeViewer);

      expect(
        screen.queryByLabelText('ShiftAssignments.remove'),
      ).not.toBeInTheDocument();
    });

    it('should not show an accept button on the proposal for the employee who created it', () => {
      renderModal({}, proposingEmployeeViewer);

      expect(
        screen.queryByLabelText('ShiftAssignments.accept'),
      ).not.toBeInTheDocument();
    });

    it("should show an accept button on the proposal for the schedule's own manager", () => {
      renderModal({}, managerAuthorViewer);

      expect(
        screen.getByLabelText('ShiftAssignments.accept'),
      ).toBeInTheDocument();
    });

    it("should not show an accept button for a manager who isn't the schedule's author", () => {
      renderModal({}, managerOtherViewer);

      expect(
        screen.queryByLabelText('ShiftAssignments.accept'),
      ).not.toBeInTheDocument();
    });

    it("should not show a remove button on the proposal for the schedule's own manager", () => {
      renderModal(
        { shift: { ...baseShift, assignments: [] } },
        managerAuthorViewer,
      );

      expect(
        screen.queryByLabelText('ShiftAssignments.remove'),
      ).not.toBeInTheDocument();
    });
  });

  describe('proposal removal behavior', () => {
    it('should withdraw the proposal, notify the user, and refresh the page', async () => {
      mockedApiFetchFromClient.mockResolvedValue(undefined);
      renderModal({}, proposingEmployeeViewer);

      fireEvent.click(screen.getByLabelText('ShiftAssignments.remove'));

      await waitFor(() =>
        expect(mockedApiFetchFromClient).toHaveBeenCalledWith(
          '/assignment-proposals/proposal-1',
          { method: 'DELETE' },
        ),
      );
      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith(
          'ShiftAssignments.proposalWithdrawn',
        ),
      );
      expect(mockRouterRefresh).toHaveBeenCalled();
    });

    it('should show a distinct error when withdrawal conflicts with the current state', async () => {
      mockedApiFetchFromClient.mockRejectedValue(
        new ApiError(
          'Request to /assignment-proposals/proposal-1 failed with status 409',
          409,
        ),
      );
      renderModal({}, proposingEmployeeViewer);

      fireEvent.click(screen.getByLabelText('ShiftAssignments.remove'));

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('commonErrors.conflict'),
      );
    });

    it('should show a generic error when withdrawal fails for another reason', async () => {
      mockedApiFetchFromClient.mockRejectedValue(new Error('network down'));
      renderModal({}, proposingEmployeeViewer);

      fireEvent.click(screen.getByLabelText('ShiftAssignments.remove'));

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('commonErrors.generic'),
      );
    });
  });

  describe('proposal accept behavior', () => {
    it('should accept the proposal, notify the user, and refresh the page', async () => {
      mockedApiFetchFromClient.mockResolvedValue(undefined);
      renderModal({}, managerAuthorViewer);

      fireEvent.click(screen.getByLabelText('ShiftAssignments.accept'));

      await waitFor(() =>
        expect(mockedApiFetchFromClient).toHaveBeenCalledWith(
          '/assignment-proposals/proposal-1/accept',
          { method: 'POST' },
        ),
      );
      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith(
          'ShiftAssignments.proposalAccepted',
        ),
      );
      expect(mockRouterRefresh).toHaveBeenCalled();
    });

    it('should show a distinct error when accepting conflicts with the current state', async () => {
      mockedApiFetchFromClient.mockRejectedValue(
        new ApiError(
          'Request to /assignment-proposals/proposal-1/accept failed with status 409',
          409,
        ),
      );
      renderModal({}, managerAuthorViewer);

      fireEvent.click(screen.getByLabelText('ShiftAssignments.accept'));

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('commonErrors.conflict'),
      );
    });

    it('should show a generic error when accepting fails for another reason', async () => {
      mockedApiFetchFromClient.mockRejectedValue(new Error('network down'));
      renderModal({}, managerAuthorViewer);

      fireEvent.click(screen.getByLabelText('ShiftAssignments.accept'));

      await waitFor(() =>
        expect(toast.error).toHaveBeenCalledWith('commonErrors.generic'),
      );
    });
  });
});
