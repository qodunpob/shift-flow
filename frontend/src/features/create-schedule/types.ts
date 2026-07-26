import { DateRange } from '@/components/date-range-picker/types';

export interface CreateScheduleFormValues {
  label: string;
  dates: DateRange | null;
  timeZone: string;
}
