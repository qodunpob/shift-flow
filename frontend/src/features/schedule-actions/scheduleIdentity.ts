import { Schedule } from '@/lib/api/types';
import { scheduleRange } from '@/utils/scheduleRange';

export const formatScheduleIdentity = (
  schedule: Schedule,
  locale: string,
): string => {
  if (schedule.label) return schedule.label;

  return scheduleRange(schedule, locale);
};
