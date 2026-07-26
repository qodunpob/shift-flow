import { isScheduleEditable } from '../isScheduleEditable';

describe('features/schedule-actions/isScheduleEditable', () => {
  it.each(['DRAFT', 'IN_REVIEW', 'REJECTED'] as const)(
    'should return true for %s',
    (status) => {
      expect(isScheduleEditable(status)).toBe(true);
    },
  );

  it.each(['AWAITING_APPROVAL', 'APPROVED'] as const)(
    'should return false for %s',
    (status) => {
      expect(isScheduleEditable(status)).toBe(false);
    },
  );
});
