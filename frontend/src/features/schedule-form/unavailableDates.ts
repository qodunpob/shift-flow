import { Matcher } from '@daypicker/react';
import { UnavailableDates } from '@/lib/api/types';
import { zonedInstantToLocalDate } from '@/features/schedule-form/zonedDate';

/**
 * Converts each unavailable range into the calendar days it disables,
 * resolved in *its own* schedule's persisted zone rather than the zone the
 * schedule being created/edited will end up with - the two can differ, and
 * only the origin zone tells you which days a given range actually covers.
 * The schedule currently being edited is excluded server-side (via
 * useUnavailableDatesQuery's excludeId), not here - the response never
 * carries an id to filter on in the first place.
 */
export const unavailableDatesToDisabledMatcher = (
  unavailableDates: UnavailableDates[],
): Matcher[] =>
  unavailableDates.map((range) => ({
    from: zonedInstantToLocalDate(range.startsAt, range.timeZone),
    to: zonedInstantToLocalDate(range.endsAt, range.timeZone),
  }));
