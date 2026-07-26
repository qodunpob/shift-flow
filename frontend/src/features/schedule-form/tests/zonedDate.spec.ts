import { zonedInstantToLocalDate } from '../zonedDate';

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

      // The raw instant reads March 31st in UTC; the conversion must not
      // just wrap the raw instant in a Date - it must produce a Date whose
      // local getters read April 1st regardless of the runtime's own zone.
      expect(result.toDateString()).toBe(new Date(2026, 3, 1).toDateString());
      expect(result.toDateString()).not.toBe(
        new Date('2026-03-31T15:00:00.000Z').toDateString(),
      );
    });
  });
});
