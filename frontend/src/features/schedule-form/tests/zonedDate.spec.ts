import { DateTime } from 'luxon';
import { localDateToZonedInstant, zonedInstantToLocalDate } from '../zonedDate';

describe('features/schedule-form/zonedDate', () => {
  describe('zonedInstantToLocalDate', () => {
    it('should recover the calendar day the instant represents in the given zone', () => {
      // 2026-03-31T15:00:00.000Z is 2026-04-01T00:00:00+09:00 in Tokyo.
      const result = zonedInstantToLocalDate(
        '2026-03-31T15:00:00.000Z',
        'Asia/Tokyo',
      );

      expect(result.getFullYear()).toBe(2026);
      expect(result.getMonth()).toBe(3); // April, 0-indexed
      expect(result.getDate()).toBe(1);
    });

    it('should encode the day using local-Date semantics, not the raw UTC instant', () => {
      const result = zonedInstantToLocalDate(
        '2026-03-31T15:00:00.000Z',
        'Asia/Tokyo',
      );

      expect(result.toDateString()).toBe(new Date(2026, 3, 1).toDateString());
    });
  });

  describe('localDateToZonedInstant', () => {
    it('should produce an instant that recovers the same calendar day when reinterpreted through the same zone', () => {
      const localDay = new Date(2026, 7, 9); // August 9th, local components

      const result = localDateToZonedInstant(localDay, 'Asia/Tokyo');

      // Mirrors what the backend's startOfDayWithTz/endOfDayWithTz do:
      // reinterpret the instant through the same zone and check the day.
      const reinterpreted = DateTime.fromJSDate(result, { zone: 'Asia/Tokyo' });
      expect(reinterpreted.year).toBe(2026);
      expect(reinterpreted.month).toBe(8);
      expect(reinterpreted.day).toBe(9);
    });

    it('should round-trip correctly through startOfDayWithTz-equivalent logic regardless of the local calendar day components used to construct it', () => {
      // Simulates the exact edit-mode no-op-resubmit scenario: a schedule's
      // real startsAt/endsAt, pre-filled via zonedInstantToLocalDate, then
      // re-submitted unchanged via localDateToZonedInstant.
      const originalStartsAt = '2026-08-02T15:00:00.000Z'; // = Aug 3 00:00 JST
      const zone = 'Asia/Tokyo';

      const displayed = zonedInstantToLocalDate(originalStartsAt, zone);
      const resubmitted = localDateToZonedInstant(displayed, zone);

      // Reinterpreting the resubmitted instant through the same zone must
      // land on the exact same calendar day as the original.
      const reinterpreted = DateTime.fromJSDate(resubmitted, { zone });
      const original = DateTime.fromISO(originalStartsAt, { zone });
      expect(reinterpreted.toISODate()).toBe(original.toISODate());
    });
  });
});
