import { endOfDayWithTz, startOfDayWithTz } from '../timezone';

describe('utils/timezone', () => {
  describe('startOfDayWithTz', () => {
    it('should return midnight UTC when the time zone is UTC', () => {
      const result = startOfDayWithTz(
        new Date('2026-01-01T10:00:00.000Z'),
        'UTC',
      );

      expect(result).toEqual(new Date('2026-01-01T00:00:00.000Z'));
    });

    it('should compute the UTC instant for local midnight in the given time zone', () => {
      const result = startOfDayWithTz(
        new Date('2026-07-25T05:02:25.714Z'),
        'Asia/Tokyo',
      );

      expect(result).toEqual(new Date('2026-07-24T15:00:00.000Z'));
    });
  });

  describe('endOfDayWithTz', () => {
    it('should return the last millisecond of the UTC day when the time zone is UTC', () => {
      const result = endOfDayWithTz(
        new Date('2026-01-01T10:00:00.000Z'),
        'UTC',
      );

      expect(result).toEqual(new Date('2026-01-01T23:59:59.999Z'));
    });

    it('should compute the UTC instant for local end-of-day in the given time zone', () => {
      const result = endOfDayWithTz(
        new Date('2026-07-25T05:02:25.714Z'),
        'Asia/Tokyo',
      );

      expect(result).toEqual(new Date('2026-07-25T14:59:59.999Z'));
    });
  });
});
