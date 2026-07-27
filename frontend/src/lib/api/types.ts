import type { components } from '@/lib/api/schema';

export type User = components['schemas']['UserResponseDto'];
export type CurrentUser = User;
export type PaginatedSchedules = components['schemas']['PaginatedSchedulesDto'];
export type Schedule = components['schemas']['ScheduleViewDto'];
export type CreatedSchedule = components['schemas']['ScheduleEntity'];
export type ScheduleStatus = Schedule['status'];
export type Shift = components['schemas']['ShiftBoardViewDto'];
export type Employee = components['schemas']['EmployeeRefDto'];
export type ShiftAssignment = components['schemas']['AssignmentViewDto'];
export type ShiftProposal = components['schemas']['ProposalViewDto'];
export type UnavailableDates = components['schemas']['UnavailableDatesDto'];

export interface ApiFetchInit extends RequestInit {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  params?: Record<string, any>;
}
