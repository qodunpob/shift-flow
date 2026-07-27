import { DateTime } from 'luxon';
import {
  cellHeight,
  columnWidth,
  dayLabelHeight,
  renderShift,
  RenderShiftArgs,
} from '@/components/time-sheet/TimeSheet';
import { Shift } from '@/lib/api/types';

jest.mock('next-intl', () => ({
  useLocale: () => 'fallback',
  useTranslations: () => (key: string) => key,
}));

jest.mock('@/i18n/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn(), push: jest.fn() }),
}));

const TIME_ZONE = 'Asia/Tokyo';

// Aug 1st 00:00 in Tokyo - every case below picks shift dates a few days
// after this so `left` values are never accidentally 0, which would hide
// an indexing bug.
const scheduleStartsAt = DateTime.fromISO('2026-08-01T00:00:00.000', {
  zone: TIME_ZONE,
});

const baseShift: Shift = {
  id: 'shift-1',
  scheduleId: 'schedule-1',
  createdAt: '2026-07-20T00:00:00.000Z',
  createdBy: 'manager-1',
  updatedAt: '2026-07-20T00:00:00.000Z',
  updatedBy: 'manager-1',
  deletedAt: null,
  startsAt: '2026-08-03T23:00:00.000Z',
  endsAt: '2026-08-04T07:30:00.000Z',
  requiredHeadcount: 2,
  filledCount: 0,
  spotsRemaining: 2,
  assignments: [],
  proposals: [],
};

const renderArgs = (
  overrides: Partial<Pick<Shift, 'startsAt' | 'endsAt'>>,
): RenderShiftArgs => ({
  shift: { ...baseShift, ...overrides },
  scheduleStartsAt,
  locale: 'fallback',
  timeZone: TIME_ZONE,
  onClick: jest.fn(),
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sx = (element: any): Record<string, number> => element.props.sx;

describe('components/time-sheet/TimeSheet renderShift', () => {
  describe('a same-day shift', () => {
    it('should render exactly one sector', () => {
      // Tokyo: Aug 4 08:00 - Aug 4 16:30
      const sectors = renderShift(
        renderArgs({
          startsAt: '2026-08-03T23:00:00.000Z',
          endsAt: '2026-08-04T07:30:00.000Z',
        }),
      );

      expect(sectors).toHaveLength(1);
    });

    it("should position the sector from the shift's start to its end time, on its own day column", () => {
      const [sector] = renderShift(
        renderArgs({
          startsAt: '2026-08-03T23:00:00.000Z',
          endsAt: '2026-08-04T07:30:00.000Z',
        }),
      );

      expect(sx(sector)).toEqual({
        top: dayLabelHeight + 8 * cellHeight,
        height: 8 * cellHeight + 30,
        left: 3 * columnWidth,
      });
    });

    it('should use a time-only label, not a date', () => {
      const [sector] = renderShift(
        renderArgs({
          startsAt: '2026-08-03T23:00:00.000Z',
          endsAt: '2026-08-04T07:30:00.000Z',
        }),
      );

      expect(sector.props.children.props.timeLabel).toBe('08:00 – 16:30');
    });
  });

  describe('a shift spanning two calendar days', () => {
    // Tokyo: Aug 3 23:00 - Aug 4 07:00
    const args = renderArgs({
      startsAt: '2026-08-03T14:00:00.000Z',
      endsAt: '2026-08-03T22:00:00.000Z',
    });

    it('should render exactly two sectors, one per day', () => {
      expect(renderShift(args)).toHaveLength(2);
    });

    it("should extend the first day's sector from the start time to the bottom of the column", () => {
      const [first] = renderShift(args);

      expect(sx(first)).toEqual({
        top: dayLabelHeight + 23 * cellHeight,
        bottom: 0,
        left: 2 * columnWidth,
      });
    });

    it("should extend the last day's sector from the top of the column to the end time", () => {
      const [, last] = renderShift(args);

      expect(sx(last)).toEqual({
        top: dayLabelHeight,
        height: 7 * cellHeight,
        left: 3 * columnWidth,
      });
    });

    it('should use a date+time label, since the boundaries fall on different days', () => {
      const [first] = renderShift(args);

      expect(first.props.children.props.timeLabel).toBe(
        '08/03 23:00 – 08/04 07:00',
      );
    });
  });

  describe('a shift spanning three calendar days', () => {
    // Tokyo: Aug 3 22:00 - Aug 5 06:00 (Aug 3, Aug 4, Aug 5)
    const args = renderArgs({
      startsAt: '2026-08-03T13:00:00.000Z',
      endsAt: '2026-08-04T21:00:00.000Z',
    });

    it('should render exactly three sectors - one per calendar day, including the middle one', () => {
      // Regression coverage: the middle day's sector previously went
      // missing entirely for any shift spanning exactly 3 calendar days.
      expect(renderShift(args)).toHaveLength(3);
    });

    it("should extend the middle day's sector across the full column, from the header to the bottom", () => {
      const [, middle] = renderShift(args);

      expect(sx(middle)).toEqual({
        top: dayLabelHeight,
        bottom: 0,
        left: 3 * columnWidth,
      });
    });

    it('should place the first, middle, and last sectors in three consecutive, non-overlapping columns', () => {
      const sectors = renderShift(args);
      const lefts = sectors.map((sector) => sx(sector).left);

      expect(lefts).toEqual([
        2 * columnWidth,
        3 * columnWidth,
        4 * columnWidth,
      ]);
    });
  });

  describe('a shift spanning five calendar days', () => {
    // Tokyo: Aug 3 20:00 - Aug 7 04:00 (Aug 3, 4, 5, 6, 7 - three middle days)
    const args = renderArgs({
      startsAt: '2026-08-03T11:00:00.000Z',
      endsAt: '2026-08-06T19:00:00.000Z',
    });

    it('should render exactly five sectors - the first day, three middle days, and the last day', () => {
      expect(renderShift(args)).toHaveLength(5);
    });

    it('should give each middle-day sector its own independent left position, not one shared value', () => {
      // Regression coverage: the middle sectors were previously built via
      // Array(n).fill(sameObject), so every middle day mutated the exact
      // same object and ended up stacked on top of each other at
      // whichever `left` was assigned last.
      const sectors = renderShift(args);
      const middleLefts = sectors.slice(1, 4).map((sector) => sx(sector).left);

      expect(middleLefts).toEqual([
        3 * columnWidth,
        4 * columnWidth,
        5 * columnWidth,
      ]);
      expect(new Set(middleLefts).size).toBe(3);
    });

    it('should place every sector in a strictly increasing column, one columnWidth apart, with no gaps or overlaps', () => {
      const sectors = renderShift(args);
      const lefts = sectors.map((sector) => sx(sector).left);

      for (let i = 1; i < lefts.length; i++) {
        expect(lefts[i] - lefts[i - 1]).toBe(columnWidth);
      }
    });
  });

  describe('label overlap', () => {
    it("should never position a sector above the day-label header row, for any day's sector in a multi-day shift", () => {
      // Tokyo: Aug 3 20:00 - Aug 7 04:00
      const args = renderArgs({
        startsAt: '2026-08-03T11:00:00.000Z',
        endsAt: '2026-08-06T19:00:00.000Z',
      });

      const sectors = renderShift(args);

      for (const sector of sectors) {
        expect(sx(sector).top).toBeGreaterThanOrEqual(dayLabelHeight);
      }
    });

    it("should not let the last day's sector overshoot past its own end time (no extra dayLabelHeight added to its height)", () => {
      // Tokyo: Aug 3 23:00 - Aug 4 07:00 - last day's sector should stop
      // exactly at 07:00 (7 * cellHeight below the header), not 40px lower.
      const args = renderArgs({
        startsAt: '2026-08-03T14:00:00.000Z',
        endsAt: '2026-08-03T22:00:00.000Z',
      });

      const [, last] = renderShift(args);

      expect(sx(last).height).toBe(7 * cellHeight);
    });
  });
});
