import { Schedule } from '@/lib/api/types';
import { DateTime } from 'luxon';
import { dateFormat } from '@/constants/dates';

export const scheduleRange = (
  schedule: Pick<Schedule, 'startsAt' | 'endsAt' | 'timeZone'>,
  locale: string,
) => {
  const formatDate = (date: string) =>
    DateTime.fromISO(date, { zone: schedule.timeZone }).toFormat(
      dateFormat(locale).scheduleBoundaryDate,
    );

  return `${formatDate(schedule.startsAt)} – ${formatDate(schedule.endsAt)}`;
};
