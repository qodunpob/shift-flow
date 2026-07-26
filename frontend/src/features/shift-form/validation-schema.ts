import * as yup from 'yup';
import { ShiftFormValues } from '@/features/shift-form/types';

export const shiftFormSchema: yup.ObjectSchema<ShiftFormValues> = yup.object({
  startsAt: yup.date().required(),
  endsAt: yup.date().required(),
  requiredHeadcount: yup.number().required(),
});
