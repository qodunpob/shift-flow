import { formatScheduleIdentity } from '../scheduleIdentity';
import { Schedule } from '@/lib/api/types';

const baseSchedule: Schedule = {
  id: 'schedule-1',
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
};

describe('features/schedule-actions/scheduleIdentity', () => {
  it('should return the label when the schedule has one', () => {
    const schedule = { ...baseSchedule, label: 'Week 32' };

    expect(formatScheduleIdentity(schedule, 'fallback')).toBe('Week 32');
  });

  it('should fall back to the formatted date range when the schedule has no label', () => {
    expect(formatScheduleIdentity(baseSchedule, 'fallback')).toBe(
      '08.03 – 08.09',
    );
  });
});
