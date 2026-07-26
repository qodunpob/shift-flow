import { CurrentUser, Schedule } from '@/lib/api/types';

export const isEmployee = (roles: CurrentUser['roles']) =>
  roles.includes('EMPLOYEE');
export const isManager = (roles: CurrentUser['roles']) =>
  roles.includes('MANAGER');
export const isApprover = (roles: CurrentUser['roles']) =>
  roles.includes('APPROVER');
export const isMine = (
  schedule: Pick<Schedule, 'createdBy'>,
  user: Pick<CurrentUser, 'id'>,
) => schedule.createdBy === user.id;
