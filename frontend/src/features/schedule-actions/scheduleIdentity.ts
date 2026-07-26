import { DateTime } from 'luxon';
import { dateFormat } from '@/constants/dates';
import { Schedule } from '@/lib/api/types';

export const formatScheduleIdentity = (
  schedule: Schedule,
  locale: string,
): string => {
  if (schedule.label) return schedule.label;

  const format = dateFormat(locale).scheduleBoundaryDate;
  const start = DateTime.fromISO(schedule.startsAt).toFormat(format);
  const end = DateTime.fromISO(schedule.endsAt).toFormat(format);
  return `${start} – ${end}`;
};
