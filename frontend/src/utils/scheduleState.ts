import { CurrentUser, Schedule, ScheduleStatus } from '@/lib/api/types';
import { isMine } from '@/utils/user';

const editableStatuses: ScheduleStatus[] = ['DRAFT', 'IN_REVIEW', 'REJECTED'];

export const isEditable = (schedule: Pick<Schedule, 'status' | 'createdBy'>) =>
  editableStatuses.includes(schedule.status);

export const canEdit = (
  schedule: Pick<Schedule, 'status' | 'createdBy'>,
  user: Pick<CurrentUser, 'id'>,
) => isEditable(schedule) && isMine(schedule.createdBy, user.id);
