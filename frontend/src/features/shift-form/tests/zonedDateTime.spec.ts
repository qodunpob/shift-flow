import { DateTime } from 'luxon';
import { localDateTimeToZonedInstant } from '../zonedDateTime';

describe('features/shift-form/zonedDateTime', () => {
  describe('localDateTimeToZonedInstant', () => {
    it('should combine the local day and time into an instant that reinterprets to the same wall-clock time in the given zone', () => {
      const localDay = new Date(2026, 7, 9); // August 9th, local components

      const result = localDateTimeToZonedInstant(
        localDay,
        '08:30',
        'Asia/Tokyo',
      );

      const reinterpreted = DateTime.fromJSDate(result, { zone: 'Asia/Tokyo' });
      expect(reinterpreted.year).toBe(2026);
      expect(reinterpreted.month).toBe(8);
      expect(reinterpreted.day).toBe(9);
      expect(reinterpreted.hour).toBe(8);
      expect(reinterpreted.minute).toBe(30);
    });

    it("should not let the browser's own zone influence the resulting instant", () => {
      const localDay = new Date(2026, 7, 9);

      const tokyo = localDateTimeToZonedInstant(
        localDay,
        '08:30',
        'Asia/Tokyo',
      );
      const newYork = localDateTimeToZonedInstant(
        localDay,
        '08:30',
        'America/New_York',
      );

      expect(tokyo.getTime()).not.toBe(newYork.getTime());
      expect(DateTime.fromJSDate(tokyo, { zone: 'Asia/Tokyo' }).hour).toBe(8);
      expect(
        DateTime.fromJSDate(newYork, { zone: 'America/New_York' }).hour,
      ).toBe(8);
    });
  });
});
