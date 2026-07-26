import { ScheduleStatus } from '@/lib/api/types';

const EDITABLE_STATUSES: ReadonlySet<ScheduleStatus> = new Set([
  'DRAFT',
  'IN_REVIEW',
  'REJECTED',
]);

export const isScheduleEditable = (status: ScheduleStatus): boolean =>
  EDITABLE_STATUSES.has(status);
