import { DateTime } from 'luxon';

/**
 * Recovers the calendar day `isoInstant` represents in `zone`, encoded as a
 * local Date - one whose local Y/M/D getters read back that same day
 * regardless of what zone the code reading it is actually running in. This
 * is how a persisted UTC instant is turned back into a value
 * DateRangePicker (which only ever reads Dates via local getters) will
 * display correctly, independent of the browser's own zone.
 */
export const zonedInstantToLocalDate = (
  isoInstant: string,
  zone: string,
): Date => {
  const zoned = DateTime.fromISO(isoInstant, { zone });
  return new Date(zoned.year, zoned.month - 1, zoned.day);
};

/**
 * Re-anchors a locally-displayed calendar day (as read via local Date
 * getters - what DateRangePicker's value currently shows, regardless of
 * whether it was freshly picked or pre-filled via zonedInstantToLocalDate)
 * into an instant that unambiguously represents that same day once the
 * backend reinterprets it through `zone`. Anchored at noon specifically:
 * both this construction and the backend's startOfDayWithTz/endOfDayWithTz
 * use the SAME `zone`, so there is no cross-zone ambiguity regardless of
 * what the browser's own zone actually is - the browser's zone never
 * enters this calculation, only `date`'s already-resolved local Y/M/D and
 * the explicitly selected `zone` do.
 */
export const localDateToZonedInstant = (date: Date, zone: string): Date =>
  DateTime.fromObject(
    {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hour: 12,
    },
    { zone },
  ).toJSDate();
