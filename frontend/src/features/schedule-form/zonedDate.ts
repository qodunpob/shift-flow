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
