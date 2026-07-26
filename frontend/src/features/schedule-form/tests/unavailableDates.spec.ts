import { unavailableDatesToDisabledMatcher } from '../unavailableDates';
import { UnavailableDates } from '@/lib/api/types';

describe('features/schedule-form/unavailableDates', () => {
  describe('unavailableDatesToDisabledMatcher', () => {
    it("should resolve each range's disabled days using its own persisted time zone", () => {
      const unavailableDates: UnavailableDates[] = [
        {
          id: 'schedule-1',
          // 2026-08-02T15:00:00.000Z is 2026-08-03T00:00:00+09:00 in Tokyo.
          startsAt: '2026-08-02T15:00:00.000Z',
          // 2026-08-09T14:59:59.999Z is 2026-08-09T23:59:59.999+09:00 in Tokyo.
          endsAt: '2026-08-09T14:59:59.999Z',
          timeZone: 'Asia/Tokyo',
        },
      ];

      const result = unavailableDatesToDisabledMatcher(unavailableDates);

      expect(result).toEqual([
        { from: new Date(2026, 7, 3), to: new Date(2026, 7, 9) },
      ]);
    });

    it('should resolve two ranges in different zones independently, each in its own zone', () => {
      const unavailableDates: UnavailableDates[] = [
        {
          id: 'schedule-1',
          startsAt: '2026-08-02T15:00:00.000Z',
          endsAt: '2026-08-02T15:00:00.000Z',
          timeZone: 'Asia/Tokyo',
        },
        {
          id: 'schedule-2',
          startsAt: '2026-08-02T15:00:00.000Z',
          endsAt: '2026-08-02T15:00:00.000Z',
          timeZone: 'America/New_York',
        },
      ];

      const result = unavailableDatesToDisabledMatcher(unavailableDates);

      // The same instant lands on different calendar days in each zone.
      expect(result).toEqual([
        { from: new Date(2026, 7, 3), to: new Date(2026, 7, 3) },
        { from: new Date(2026, 7, 2), to: new Date(2026, 7, 2) },
      ]);
    });

    it("should exclude the range matching excludeId so a schedule doesn't see itself as unavailable", () => {
      const unavailableDates: UnavailableDates[] = [
        {
          id: 'schedule-1',
          startsAt: '2026-08-02T15:00:00.000Z',
          endsAt: '2026-08-09T14:59:59.999Z',
          timeZone: 'Asia/Tokyo',
        },
        {
          id: 'schedule-2',
          startsAt: '2026-08-16T15:00:00.000Z',
          endsAt: '2026-08-23T14:59:59.999Z',
          timeZone: 'Asia/Tokyo',
        },
      ];

      const result = unavailableDatesToDisabledMatcher(
        unavailableDates,
        'schedule-1',
      );

      expect(result).toEqual([
        { from: new Date(2026, 7, 17), to: new Date(2026, 7, 23) },
      ]);
    });

    it('should return an empty matcher list when there are no unavailable dates', () => {
      expect(unavailableDatesToDisabledMatcher([])).toEqual([]);
    });
  });
});
