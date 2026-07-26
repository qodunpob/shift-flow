import { fireEvent, render, screen } from '@testing-library/react';
import { Settings } from 'luxon';
import React from 'react';
import { AssignmentsModal } from '@/features/shift-assignments/AssignmentsModal';
import { Shift } from '@/lib/api/types';

jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'fallback',
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

describe('features/shift-assignments/AssignmentsModal', () => {
  beforeEach(() => {
    Settings.defaultZone = 'America/New_York';
  });

  afterEach(() => {
    Settings.defaultZone = 'system';
  });

  it("should show the shift's boundary times in the given time zone, not the runtime's", () => {
    render(
      <AssignmentsModal
        shift={baseShift}
        timeZone="Asia/Tokyo"
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByText('08/03 08:00 – 08/03 16:30')).toBeInTheDocument();
  });

  it('should show the required headcount', () => {
    render(
      <AssignmentsModal
        shift={baseShift}
        timeZone="Asia/Tokyo"
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByText('labels.requiredHeadcount: 3')).toBeInTheDocument();
  });

  it('should list each assigned employee by name', () => {
    render(
      <AssignmentsModal
        shift={baseShift}
        timeZone="Asia/Tokyo"
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
  });

  it('should list each proposed employee by name', () => {
    render(
      <AssignmentsModal
        shift={baseShift}
        timeZone="Asia/Tokyo"
        onClose={jest.fn()}
      />,
    );

    expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
  });

  it('should show a fallback label when an assignment has no employee', () => {
    render(
      <AssignmentsModal
        shift={{
          ...baseShift,
          assignments: [
            {
              id: 'assignment-2',
              employeeId: 'employee-3',
              employee: null,
              status: 'ACCEPTED',
              declineReason: null,
            },
          ],
        }}
        timeZone="Asia/Tokyo"
        onClose={jest.fn()}
      />,
    );

    expect(
      screen.getByText('ShiftAssignments.unknownEmployee'),
    ).toBeInTheDocument();
  });

  it('should show an empty state when there are no assignments', () => {
    render(
      <AssignmentsModal
        shift={{ ...baseShift, assignments: [] }}
        timeZone="Asia/Tokyo"
        onClose={jest.fn()}
      />,
    );

    expect(
      screen.getByText('ShiftAssignments.noneAssigned'),
    ).toBeInTheDocument();
  });

  it('should not show the proposals section when there are no proposals', () => {
    render(
      <AssignmentsModal
        shift={{ ...baseShift, proposals: [] }}
        timeZone="Asia/Tokyo"
        onClose={jest.fn()}
      />,
    );

    expect(
      screen.queryByText('ShiftAssignments.proposals'),
    ).not.toBeInTheDocument();
  });

  it('should call onClose when the close button is clicked', () => {
    const onClose = jest.fn();
    render(
      <AssignmentsModal
        shift={baseShift}
        timeZone="Asia/Tokyo"
        onClose={onClose}
      />,
    );

    fireEvent.click(screen.getByText('common.close'));

    expect(onClose).toHaveBeenCalled();
  });
});
