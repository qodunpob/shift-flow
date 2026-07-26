import { render, screen } from '@testing-library/react';
import React from 'react';
import { ScheduleCard } from '@/components/schedule-card/ScheduleCard';
import { CurrentUserProvider } from '@/providers/CurrentUserProvider';
import { CurrentUser, Schedule } from '@/lib/api/types';

jest.mock('next-intl', () => ({
  useLocale: () => 'fallback',
  useTranslations: () => (key: string) => key,
}));

jest.mock('@/features/schedule-actions/ScheduleActionsMenu', () => ({
  ScheduleActionsMenu: () => <div data-testid="schedule-actions-menu" />,
}));

const currentUser: CurrentUser = {
  id: 'manager-1',
  createdAt: '2026-07-20T00:00:00.000Z',
  createdBy: 'manager-1',
  updatedAt: '2026-07-20T00:00:00.000Z',
  updatedBy: 'manager-1',
  deletedAt: null,
  firstName: 'Manager',
  lastName: 'One',
  roles: ['MANAGER'],
};

const makeSchedule = (createdBy: string): Schedule => ({
  id: 'schedule-1',
  createdAt: '2026-07-20T00:00:00.000Z',
  createdBy,
  updatedAt: '2026-07-20T00:00:00.000Z',
  updatedBy: createdBy,
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
});

const renderCard = (schedule: Schedule) =>
  render(
    <CurrentUserProvider user={currentUser}>
      <ScheduleCard schedule={schedule} resetFiltersAndPage={jest.fn()} />
    </CurrentUserProvider>,
  );

describe('components/schedule-card/ScheduleCard', () => {
  it('should show the actions menu when the current user owns the schedule', () => {
    renderCard(makeSchedule('manager-1'));

    expect(screen.getByTestId('schedule-actions-menu')).toBeInTheDocument();
  });

  it('should not show the actions menu when the current user does not own the schedule', () => {
    renderCard(makeSchedule('someone-else'));

    expect(
      screen.queryByTestId('schedule-actions-menu'),
    ).not.toBeInTheDocument();
  });
});
