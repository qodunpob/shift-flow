import { createScheduleSchema } from '../validation-schema';
import { CreateScheduleFormValues } from '@/features/schedule-form/types';

const VALID_VALUES: CreateScheduleFormValues = {
  label: 'Summer schedule',
  dates: {
    startsAt: new Date(2026, 6, 25),
    endsAt: new Date(2026, 7, 2),
  },
  timeZone: 'Asia/Tokyo',
};

describe('features/schedule-form/validation-schema', () => {
  it('should accept a fully valid set of values', async () => {
    await expect(createScheduleSchema.isValid(VALID_VALUES)).resolves.toBe(
      true,
    );
  });

  it('should accept an empty label', async () => {
    await expect(
      createScheduleSchema.isValid({ ...VALID_VALUES, label: '' }),
    ).resolves.toBe(true);
  });

  it('should reject a null dates value', async () => {
    await expect(
      createScheduleSchema.isValid({ ...VALID_VALUES, dates: null }),
    ).resolves.toBe(false);
  });

  it('should reject an empty timeZone', async () => {
    await expect(
      createScheduleSchema.isValid({ ...VALID_VALUES, timeZone: '' }),
    ).resolves.toBe(false);
  });

  it('should reject a timeZone that is not a valid IANA zone', async () => {
    await expect(
      createScheduleSchema.isValid({
        ...VALID_VALUES,
        timeZone: 'Not/AZone',
      }),
    ).resolves.toBe(false);
  });
});
