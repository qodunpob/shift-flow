import { scheduleRange } from '../scheduleRange';

describe('utils/scheduleRange', () => {
  it("should format the range in the schedule's own time zone, not the runtime's", () => {
    const schedule = {
      startsAt: '2026-08-02T15:00:00.000Z', // = Aug 3 00:00 JST
      endsAt: '2026-08-09T14:59:59.999Z', // = Aug 9 23:59:59.999 JST
      timeZone: 'Asia/Tokyo',
    };

    expect(scheduleRange(schedule, 'fallback')).toBe('08.03 – 08.09');
  });
});
