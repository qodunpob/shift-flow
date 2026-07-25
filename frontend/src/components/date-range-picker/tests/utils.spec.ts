import { dateFormatMap } from '@/constants/dates';
import { DateRange, formatRange, parseRangeText } from '../utils';

const FORMAT = dateFormatMap.fallback.dateRangeInput;

describe('components/date-range-picker/utils', () => {
  describe('formatRange', () => {
    it('should format a range as MM/DD/YYYY – MM/DD/YYYY', () => {
      const range: DateRange = {
        startsAt: new Date(2026, 6, 25),
        endsAt: new Date(2026, 7, 2),
      };

      expect(formatRange(range, FORMAT)).toBe('07/25/2026 – 08/02/2026');
    });

    it('should return an empty string for null', () => {
      expect(formatRange(null, FORMAT)).toBe('');
    });
  });

  describe('parseRangeText', () => {
    it('should parse a valid, complete range', () => {
      const result = parseRangeText('07/25/2026 – 08/02/2026', FORMAT);

      expect(result).toEqual({
        startsAt: new Date(2026, 6, 25),
        endsAt: new Date(2026, 7, 2),
      });
    });

    it('should return null for an incomplete range (mask placeholders remaining)', () => {
      expect(parseRangeText('07/25/2026 – __/__/____', FORMAT)).toBeNull();
    });

    it('should return null for an invalid calendar date', () => {
      expect(parseRangeText('13/45/2026 – 08/02/2026', FORMAT)).toBeNull();
    });

    it('should return null when the end date is before the start date', () => {
      expect(parseRangeText('08/02/2026 – 07/25/2026', FORMAT)).toBeNull();
    });

    it('should accept a range where start and end are the same day', () => {
      const result = parseRangeText('07/25/2026 – 07/25/2026', FORMAT);

      expect(result).toEqual({
        startsAt: new Date(2026, 6, 25),
        endsAt: new Date(2026, 6, 25),
      });
    });
  });
});
