import * as yup from 'yup';
import { CreateScheduleFormValues } from '@/features/schedule-form/types';

const TIME_ZONES = Intl.supportedValuesOf('timeZone');

export const createScheduleSchema: yup.ObjectSchema<CreateScheduleFormValues> =
  yup.object({
    label: yup.string().default('').defined(),
    dates: yup
      .object({
        startsAt: yup.date().defined(),
        endsAt: yup.date().defined(),
      })
      .nullable()
      .defined()
      .required(),
    timeZone: yup.string().oneOf(TIME_ZONES).defined().required(),
  });
