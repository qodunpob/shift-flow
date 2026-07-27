import {
  ENDS_BEFORE_STARTS_ERROR,
  shiftFormSchema,
} from '../validation-schema';
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

  describe('ends-before-starts ordering', () => {
    it('should accept an ends time strictly after the starts time on the same day', async () => {
      await expect(shiftFormSchema.isValid(VALID_VALUES)).resolves.toBe(true);
    });

    it('should accept an endsAtDate on a later calendar day than startsAtDate', async () => {
      await expect(
        shiftFormSchema.isValid({
          ...VALID_VALUES,
          endsAtDate: new Date(2026, 6, 26),
        }),
      ).resolves.toBe(true);
    });

    it('should reject an endsAtDate/endsAtTime that lands exactly on startsAtDate/startsAtTime', async () => {
      await expect(
        shiftFormSchema.isValid({
          ...VALID_VALUES,
          endsAtDate: VALID_VALUES.startsAtDate,
          endsAtTime: VALID_VALUES.startsAtTime,
        }),
      ).resolves.toBe(false);
    });

    it('should reject an endsAtDate on an earlier calendar day than startsAtDate', async () => {
      await expect(
        shiftFormSchema.isValid({
          ...VALID_VALUES,
          endsAtDate: new Date(2026, 6, 24),
        }),
      ).resolves.toBe(false);
    });

    it('should reject an endsAtTime earlier than startsAtTime on the same day', async () => {
      await expect(
        shiftFormSchema.isValid({ ...VALID_VALUES, endsAtTime: '07:00' }),
      ).resolves.toBe(false);
    });

    it('should attach the error to endsAtDate with a stable, identifiable message', async () => {
      try {
        await shiftFormSchema.validate(
          { ...VALID_VALUES, endsAtTime: '07:00' },
          { abortEarly: false },
        );
        throw new Error('expected validation to fail');
      } catch (error) {
        const validationError = error as import('yup').ValidationError;
        expect(validationError.inner).toContainEqual(
          expect.objectContaining({
            path: 'endsAtDate',
            message: ENDS_BEFORE_STARTS_ERROR,
          }),
        );
      }
    });

    it('should not report ends-before-starts when a date is still missing', async () => {
      await expect(
        shiftFormSchema.isValid({ ...VALID_VALUES, endsAtDate: null }),
      ).resolves.toBe(false);
      // Only the required-field error should be responsible - not this rule.
      try {
        await shiftFormSchema.validate(
          { ...VALID_VALUES, endsAtDate: null },
          { abortEarly: false },
        );
      } catch (error) {
        const validationError = error as import('yup').ValidationError;
        expect(validationError.inner).not.toContainEqual(
          expect.objectContaining({ message: ENDS_BEFORE_STARTS_ERROR }),
        );
      }
    });
  });
});
