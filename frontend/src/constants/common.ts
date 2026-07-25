import { ScheduleStatus } from '@/lib/api/types';

export const DEFAULT_PAGE_SIZE = 10;

export const scheduleStatuses: ScheduleStatus[] = [
  'DRAFT',
  'IN_REVIEW',
  'AWAITING_APPROVAL',
  'APPROVED',
  'REJECTED',
];
