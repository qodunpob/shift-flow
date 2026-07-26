import { fireEvent, render, screen } from '@testing-library/react';
import { Settings } from 'luxon';
import React from 'react';
import { TimeSheet } from '@/components/time-sheet/TimeSheet';
import { CurrentUserProvider } from '@/providers/CurrentUserProvider';
import { CurrentUser, Shift } from '@/lib/api/types';

jest.mock('next-intl', () => ({
  useLocale: () => 'fallback',
  useTranslations: () => (key: string) => key,
}));

jest.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn(), push: jest.fn() }),
}));

const schedule = {
  // 2026-08-02T15:00:00.000Z is 2026-08-03T00:00:00+09:00 in Tokyo.
  startsAt: '2026-08-02T15:00:00.000Z',
  // 2026-08-09T14:59:59.999Z is 2026-08-09T23:59:59.999+09:00 in Tokyo.
  endsAt: '2026-08-09T14:59:59.999Z',
  timeZone: 'Asia/Tokyo',
  createdBy: 'manager-1',
};

const shift: Shift = {
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
  requiredHeadcount: 2,
  filledCount: 0,
  spotsRemaining: 2,
  assignments: [],
  proposals: [],
};

const viewer: CurrentUser = {
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

const renderTimeSheet = (shifts: Shift[]) =>
  render(
    <CurrentUserProvider user={viewer}>
      <TimeSheet schedule={schedule} shifts={shifts} />
    </CurrentUserProvider>,
  );

describe('components/time-sheet/TimeSheet', () => {
  // The runtime's own zone must never influence what's displayed - the
  // schedule and its shifts are always shown in the schedule's own zone.
  // Setting luxon's default zone to something else here is what would
  // expose a regression back to zone-less DateTime.fromISO() calls.
  beforeEach(() => {
    Settings.defaultZone = 'America/New_York';
  });

  afterEach(() => {
    Settings.defaultZone = 'system';
  });

  it("should show the shift's boundary times in the schedule's own time zone, not the runtime's", () => {
    renderTimeSheet([shift]);

    expect(screen.getByText('08:00 – 16:30')).toBeInTheDocument();
  });

  it("should label the schedule's day columns using the schedule's own time zone", () => {
    renderTimeSheet([]);

    expect(screen.getByText('08/03')).toBeInTheDocument();
  });

  it('should open the assignments modal for a shift when it is clicked', () => {
    renderTimeSheet([shift]);

    expect(
      screen.queryByText('ShiftAssignments.title'),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('08:00 – 16:30'));

    expect(screen.getByText('ShiftAssignments.title')).toBeInTheDocument();
  });

  it('should close the assignments modal when its close button is clicked', () => {
    renderTimeSheet([shift]);

    fireEvent.click(screen.getByText('08:00 – 16:30'));
    fireEvent.click(screen.getByText('common.close'));

    expect(
      screen.queryByText('ShiftAssignments.title'),
    ).not.toBeInTheDocument();
  });
});
