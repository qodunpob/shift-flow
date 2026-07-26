import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { ScheduleToolbar } from '@/components/schedule-toolbar/ScheduleToolbar';
import { CurrentUserProvider } from '@/providers/CurrentUserProvider';
import { CurrentUser, Schedule } from '@/lib/api/types';
import { apiFetchFromClient } from '@/lib/api/client/apiFetch';
import { toast } from 'react-toastify';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'fallback',
}));

const mockRouterPush = jest.fn();
const mockRouterRefresh = jest.fn();
jest.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ push: mockRouterPush, refresh: mockRouterRefresh }),
}));

jest.mock('@/lib/api/client/apiFetch', () => ({
  apiFetchFromClient: jest.fn(),
}));

jest.mock('react-toastify', () => ({
  toast: { success: jest.fn(), error: jest.fn() },
}));

// The form modals pull in Formik/DateRangePicker/etc. and are covered by
// their own test suites - ScheduleToolbar's own wiring (which action opens
// which dialog) is what's under test here.
jest.mock('@/features/schedule-form/ScheduleFormModal', () => ({
  ScheduleFormModal: ({ mode }: { mode: string }) => (
    <div>schedule-form-modal-{mode}</div>
  ),
}));

jest.mock('@/features/shift-form/ShiftFormModal', () => ({
  ShiftFormModal: ({ open }: { open: boolean }) =>
    open ? <div>shift-form-modal</div> : null,
}));

const mockedApiFetchFromClient = apiFetchFromClient as jest.MockedFunction<
  typeof apiFetchFromClient
>;

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

const baseViewer: CurrentUser = {
  id: 'manager-1',
  createdAt: '2026-07-20T00:00:00.000Z',
  createdBy: 'manager-1',
  updatedAt: '2026-07-20T00:00:00.000Z',
  updatedBy: 'manager-1',
  deletedAt: null,
  firstName: 'Grace',
  lastName: 'Hopper',
  roles: ['MANAGER'],
};

const ownerViewer: CurrentUser = baseViewer;

const otherManagerViewer: CurrentUser = {
  ...baseViewer,
  id: 'manager-2',
  roles: ['MANAGER'],
};

const approverViewer: CurrentUser = {
  ...baseViewer,
  id: 'approver-1',
  roles: ['APPROVER'],
};

const employeeViewer: CurrentUser = {
  ...baseViewer,
  id: 'employee-1',
  roles: ['EMPLOYEE'],
};

const renderToolbar = (
  schedule: Partial<Schedule> = {},
  viewer: CurrentUser = ownerViewer,
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
        <ScheduleToolbar schedule={{ ...baseSchedule, ...schedule }} />
      </CurrentUserProvider>
    </QueryClientProvider>,
  );
};

describe('components/schedule-toolbar/ScheduleToolbar', () => {
  beforeEach(() => {
    mockedApiFetchFromClient.mockReset();
    mockRouterPush.mockReset();
    mockRouterRefresh.mockReset();
  });

  describe('visibility', () => {
    it('should render nothing for an employee', () => {
      const { container } = renderToolbar({}, employeeViewer);

      expect(container).toBeEmptyDOMElement();
    });

    it('should render nothing for a manager who does not own the schedule and is not an approver', () => {
      const { container } = renderToolbar({}, otherManagerViewer);

      expect(container).toBeEmptyDOMElement();
    });

    it('should render nothing for an approver when the schedule is not awaiting approval', () => {
      const { container } = renderToolbar(
        { status: 'APPROVED' },
        approverViewer,
      );

      expect(container).toBeEmptyDOMElement();
    });

    it("should show create shift, delete, edit, and the status action for the schedule's owner", () => {
      renderToolbar({ status: 'DRAFT' }, ownerViewer);

      expect(
        screen.getByText('ScheduleDetailsPage.createShift'),
      ).toBeInTheDocument();
      expect(screen.getByText('ScheduleActions.delete')).toBeInTheDocument();
      expect(screen.getByText('ScheduleActions.edit')).toBeInTheDocument();
      expect(screen.getByText('ScheduleActions.publish')).toBeInTheDocument();
    });

    it('should hide delete and edit but keep the status action for a non-editable owned status', () => {
      renderToolbar({ status: 'AWAITING_APPROVAL' }, ownerViewer);

      expect(
        screen.queryByText('ScheduleActions.delete'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('ScheduleActions.edit'),
      ).not.toBeInTheDocument();
      expect(screen.getByText('ScheduleActions.withdraw')).toBeInTheDocument();
    });

    it('should show approve and reject, but not create shift/delete/edit, for an approver on an awaiting-approval schedule', () => {
      renderToolbar({ status: 'AWAITING_APPROVAL' }, approverViewer);

      expect(screen.getByText('ScheduleActions.approve')).toBeInTheDocument();
      expect(screen.getByText('ScheduleActions.reject')).toBeInTheDocument();
      expect(
        screen.queryByText('ScheduleDetailsPage.createShift'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('ScheduleActions.delete'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('ScheduleActions.edit'),
      ).not.toBeInTheDocument();
    });
  });

  describe('delete', () => {
    it('should delete the schedule and redirect to the schedule list on success', async () => {
      mockedApiFetchFromClient.mockResolvedValue(undefined);
      renderToolbar({ status: 'DRAFT' }, ownerViewer);

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
      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith(
          'ScheduleActions.success.deleted',
        ),
      );
      expect(mockRouterPush).toHaveBeenCalledWith('/schedules');
    });
  });

  describe('edit', () => {
    it('should open the edit form when the edit button is clicked', () => {
      renderToolbar({ status: 'DRAFT' }, ownerViewer);

      fireEvent.click(screen.getByText('ScheduleActions.edit'));

      expect(screen.getByText('schedule-form-modal-edit')).toBeInTheDocument();
    });
  });

  describe('status action', () => {
    it('should publish the schedule and refresh the page on confirm', async () => {
      mockedApiFetchFromClient.mockResolvedValue({});
      renderToolbar({ status: 'DRAFT' }, ownerViewer);

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
      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith(
          'ScheduleActions.success.publish',
        ),
      );
      expect(mockRouterRefresh).toHaveBeenCalled();
    });
  });

  describe('approve', () => {
    it('should approve the schedule and refresh the page on confirm', async () => {
      mockedApiFetchFromClient.mockResolvedValue({});
      renderToolbar({ status: 'AWAITING_APPROVAL' }, approverViewer);

      fireEvent.click(screen.getByText('ScheduleActions.approve'));
      fireEvent.click(
        screen.getByText('ScheduleActions.confirm.approve.confirmLabel'),
      );

      await waitFor(() =>
        expect(mockedApiFetchFromClient).toHaveBeenCalledWith(
          '/schedules/schedule-1/approve',
          { method: 'POST' },
        ),
      );
      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith(
          'ScheduleActions.success.approve',
        ),
      );
      expect(mockRouterRefresh).toHaveBeenCalled();
    });
  });

  describe('reject', () => {
    it('should reject the schedule with the typed reason and refresh the page on confirm', async () => {
      mockedApiFetchFromClient.mockResolvedValue({});
      renderToolbar({ status: 'AWAITING_APPROVAL' }, approverViewer);

      fireEvent.click(screen.getByText('ScheduleActions.reject'));
      fireEvent.change(screen.getByLabelText('labels.rejectionReason'), {
        target: { value: 'Understaffed' },
      });
      fireEvent.click(
        screen.getByText('ScheduleActions.confirm.reject.confirmLabel'),
      );

      await waitFor(() =>
        expect(mockedApiFetchFromClient).toHaveBeenCalledWith(
          '/schedules/schedule-1/reject',
          {
            method: 'POST',
            body: JSON.stringify({ rejectionReason: 'Understaffed' }),
          },
        ),
      );
      await waitFor(() =>
        expect(toast.success).toHaveBeenCalledWith(
          'ScheduleActions.success.reject',
        ),
      );
      expect(mockRouterRefresh).toHaveBeenCalled();
    });

    it('should keep the confirm button disabled until a reason is typed', () => {
      renderToolbar({ status: 'AWAITING_APPROVAL' }, approverViewer);

      fireEvent.click(screen.getByText('ScheduleActions.reject'));

      expect(
        screen.getByText('ScheduleActions.confirm.reject.confirmLabel'),
      ).toBeDisabled();
    });
  });
});
