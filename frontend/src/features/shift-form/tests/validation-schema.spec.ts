import { shiftFormSchema } from '../validation-schema';
import { ShiftFormValues } from '@/features/shift-form/types';

const VALID_VALUES: ShiftFormValues = {
  startsAtDate: new Date(2026, 6, 25),
  startsAtTime: '08:00',
  endsAtDate: new Date(2026, 6, 25),
  endsAtTime: '16:30',
  requiredHeadcount: 3,
};

describe('features/shift-form/validation-schema', () => {
  it('should accept a fully valid set of values', async () => {
    await expect(shiftFormSchema.isValid(VALID_VALUES)).resolves.toBe(true);
  });

  it('should reject a null startsAtDate', async () => {
    await expect(
      shiftFormSchema.isValid({ ...VALID_VALUES, startsAtDate: null }),
    ).resolves.toBe(false);
  });

  it('should reject a null endsAtDate', async () => {
    await expect(
      shiftFormSchema.isValid({ ...VALID_VALUES, endsAtDate: null }),
    ).resolves.toBe(false);
  });

  it('should reject an empty startsAtTime', async () => {
    await expect(
      shiftFormSchema.isValid({ ...VALID_VALUES, startsAtTime: '' }),
    ).resolves.toBe(false);
  });

  it('should reject a startsAtTime that is not in HH:mm format', async () => {
    await expect(
      shiftFormSchema.isValid({ ...VALID_VALUES, startsAtTime: '8am' }),
    ).resolves.toBe(false);
  });

  it('should reject a startsAtTime with an out-of-range hour', async () => {
    await expect(
      shiftFormSchema.isValid({ ...VALID_VALUES, startsAtTime: '24:00' }),
    ).resolves.toBe(false);
  });

  it('should reject a requiredHeadcount below 1', async () => {
    await expect(
      shiftFormSchema.isValid({ ...VALID_VALUES, requiredHeadcount: 0 }),
    ).resolves.toBe(false);
  });

  it('should reject a requiredHeadcount above 10', async () => {
    await expect(
      shiftFormSchema.isValid({ ...VALID_VALUES, requiredHeadcount: 11 }),
    ).resolves.toBe(false);
  });
});
