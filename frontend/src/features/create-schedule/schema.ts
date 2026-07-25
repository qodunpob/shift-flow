import * as yup from 'yup';
import { DateRange } from '@/components/date-range-picker/utils';

export interface CreateScheduleFormValues {
  label: string;
  dates: DateRange | null;
  timeZone: string;
}

const TIME_ZONES = Intl.supportedValuesOf('timeZone');

export const createScheduleSchema: yup.ObjectSchema<CreateScheduleFormValues> =
  yup.object({
    label: yup.string().defined(),
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
