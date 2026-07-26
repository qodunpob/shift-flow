import { DateRange } from '@/components/date-range-picker/types';

export interface ScheduleFormValues {
  label: string;
  dates: DateRange | null;
  timeZone: string;
}
