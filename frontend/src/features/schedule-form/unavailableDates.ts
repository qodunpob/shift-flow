import { Matcher } from '@daypicker/react';
import { UnavailableDates } from '@/lib/api/types';
import { zonedInstantToLocalDate } from '@/features/schedule-form/zonedDate';

/**
 * Converts each unavailable range into the calendar days it disables,
 * resolved in *its own* schedule's persisted zone rather than the zone the
 * schedule being created/edited will end up with - the two can differ, and
 * only the origin zone tells you which days a given range actually covers.
 * `excludeId` drops the schedule currently being edited from the list, so
 * it doesn't show up as unavailable against itself.
 */
export const unavailableDatesToDisabledMatcher = (
  unavailableDates: UnavailableDates[],
  excludeId?: string,
): Matcher[] =>
  unavailableDates
    .filter((range) => range.id !== excludeId)
    .map((range) => ({
      from: zonedInstantToLocalDate(range.startsAt, range.timeZone),
      to: zonedInstantToLocalDate(range.endsAt, range.timeZone),
    }));
