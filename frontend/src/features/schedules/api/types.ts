import { ScheduleStatus } from '@/lib/api/types';

export interface SchedulesFilter {
  status?: ScheduleStatus | null;
  mine?: boolean;
}
