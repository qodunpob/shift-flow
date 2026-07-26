import { render, screen } from '@testing-library/react';
import React from 'react';
import { ScheduleList } from '@/components/schedule-list/ScheduleList';
import { Schedule } from '@/lib/api/types';

jest.mock('@/components/schedule-card/ScheduleCard', () => ({
  ScheduleCard: ({
    schedule,
    resetFiltersAndPage,
  }: {
    schedule: Schedule;
    resetFiltersAndPage: () => void;
  }) => (
    <div data-testid={`schedule-card-${schedule.id}`}>
      <button onClick={resetFiltersAndPage}>reset</button>
    </div>
  ),
}));

const makeSchedule = (id: string): Schedule => ({
  id,
  createdAt: '2026-07-20T00:00:00.000Z',
  createdBy: 'manager-1',
  updatedAt: '2026-07-20T00:00:00.000Z',
  updatedBy: 'manager-1',
  deletedAt: null,
  label: null,
  startsAt: '2026-08-03T00:00:00.000Z',
  endsAt: '2026-08-09T00:00:00.000Z',
  timeZone: 'UTC',
  status: 'DRAFT',
  rejectionReason: null,
  totalRequiredHeadcount: 0,
  totalFilledCount: 0,
  totalAcceptedCount: 0,
});

describe('components/schedule-list/ScheduleList', () => {
  it('should render one card per item', () => {
    render(
      <ScheduleList
        items={[makeSchedule('a'), makeSchedule('b')]}
        resetFiltersAndPage={jest.fn()}
      />,
    );

    expect(screen.getByTestId('schedule-card-a')).toBeInTheDocument();
    expect(screen.getByTestId('schedule-card-b')).toBeInTheDocument();
  });

  it('should forward resetFiltersAndPage to each card', async () => {
    const { fireEvent } = await import('@testing-library/react');
    const resetFiltersAndPage = jest.fn();
    render(
      <ScheduleList
        items={[makeSchedule('a')]}
        resetFiltersAndPage={resetFiltersAndPage}
      />,
    );

    fireEvent.click(screen.getByText('reset'));

    expect(resetFiltersAndPage).toHaveBeenCalled();
  });
});
