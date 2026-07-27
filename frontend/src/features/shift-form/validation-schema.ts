import * as yup from 'yup';
import { ShiftFormValues } from '@/features/shift-form/types';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

// Attached to formik.errors.endsAtDate when this specific rule fails, so
// ShiftFormModal can tell it apart from a plain "required" error and show
// the right message - see ENDS_BEFORE_STARTS_ERROR's usage there.
export const ENDS_BEFORE_STARTS_ERROR = 'ends-before-starts';

// Compares wall-clock date+time pairs directly, with no zone applied to
// either side - both values get the same zone applied later (via
// localDateTimeToZonedInstant), so comparing them zone-less already gives
// the correct relative order.
const combineDateAndTime = (date: Date, time: string): number => {
  const [hour, minute] = time.split(':').map(Number);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    hour,
    minute,
  ).getTime();
};

export const shiftFormSchema: yup.ObjectSchema<ShiftFormValues> = yup
  .object({
    startsAtDate: yup.date().required(),
    startsAtTime: yup.string().matches(TIME_PATTERN).defined().required(),
    endsAtDate: yup.date().required(),
    endsAtTime: yup.string().matches(TIME_PATTERN).defined().required(),
    requiredHeadcount: yup.number().min(1).max(10).required(),
  })
  .test(ENDS_BEFORE_STARTS_ERROR, ENDS_BEFORE_STARTS_ERROR, function (values) {
    const { startsAtDate, startsAtTime, endsAtDate, endsAtTime } = values;
    if (
      !startsAtDate ||
      !endsAtDate ||
      !TIME_PATTERN.test(startsAtTime) ||
      !TIME_PATTERN.test(endsAtTime)
    ) {
      return true;
    }

    const starts = combineDateAndTime(startsAtDate, startsAtTime);
    const ends = combineDateAndTime(endsAtDate, endsAtTime);

    if (ends > starts) {
      return true;
    }

    return this.createError({
      path: 'endsAtDate',
      message: ENDS_BEFORE_STARTS_ERROR,
    });
  });
