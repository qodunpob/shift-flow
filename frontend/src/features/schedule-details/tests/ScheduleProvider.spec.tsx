import { renderHook } from '@testing-library/react';
import React from 'react';
import {
  ScheduleProvider,
  useSchedule,
} from '@/features/schedule-details/ScheduleProvider';
import { Schedule } from '@/lib/api/types';

const schedule: Schedule = {
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

describe('features/schedule-details/ScheduleProvider', () => {
  it('should return the provided schedule', () => {
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ScheduleProvider schedule={schedule}>{children}</ScheduleProvider>
    );

    const { result } = renderHook(() => useSchedule(), { wrapper });

    expect(result.current).toEqual(schedule);
  });

  it('should throw when used outside a ScheduleProvider', () => {
    const consoleError = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => renderHook(() => useSchedule())).toThrow(
      'useSchedule must be used within a ScheduleProvider',
    );

    consoleError.mockRestore();
  });
});
