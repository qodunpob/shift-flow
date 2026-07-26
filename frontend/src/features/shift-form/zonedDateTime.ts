import { DateTime } from 'luxon';

/**
 * Combines a locally-picked calendar day (read via local Date getters, as
 * DatePicker's value is) with an independently-typed "HH:mm" wall-clock time
 * into the instant that represents that day+time in `zone`. The browser's
 * own zone never enters this calculation - only the date's local Y/M/D, the
 * typed hour/minute, and the explicitly selected schedule zone do.
 */
export const localDateTimeToZonedInstant = (
  date: Date,
  time: string,
  zone: string,
): Date => {
  const [hour, minute] = time.split(':').map(Number);
  return DateTime.fromObject(
    {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour,
      minute,
    },
    { zone },
  ).toJSDate();
};

/**
 * The reverse of localDateTimeToZonedInstant: recovers the calendar day and
 * wall-clock time `isoInstant` represents in `zone`, split into a local Date
 * (for DatePicker) and an "HH:mm" string (for the masked time field) - the
 * same split shape the form's own values use. The browser's own zone never
 * enters this calculation, only `zone` does.
 */
export const zonedInstantToLocalDateTime = (
  isoInstant: string,
  zone: string,
): { date: Date; time: string } => {
  const zoned = DateTime.fromISO(isoInstant, { zone });
  return {
    date: new Date(zoned.year, zoned.month - 1, zoned.day),
    time: zoned.toFormat('HH:mm'),
  };
};
