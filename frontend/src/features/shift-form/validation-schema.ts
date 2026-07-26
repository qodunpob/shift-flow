import * as yup from 'yup';
import { ShiftFormValues } from '@/features/shift-form/types';

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export const shiftFormSchema: yup.ObjectSchema<ShiftFormValues> = yup.object({
  startsAtDate: yup.date().required(),
  startsAtTime: yup.string().matches(TIME_PATTERN).defined().required(),
  endsAtDate: yup.date().required(),
  endsAtTime: yup.string().matches(TIME_PATTERN).defined().required(),
  requiredHeadcount: yup.number().min(1).max(10).required(),
});
